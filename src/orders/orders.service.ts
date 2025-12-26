import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { StockService } from '../stock/stock.service';
import { applyDefaults, DEFAULT_VALUES } from '../common/utils/field-defaults.util';
import { sanitizeObjectId } from '../common/utils/validation.util';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectConnection() private readonly connection: Connection,
    private stockService: StockService,
  ) {}

  /**
   * Validates and computes order totals server-side
   * This prevents client-side manipulation of prices
   */
  private async validateAndComputeTotals(createOrderDto: CreateOrderDto): Promise<{
    computedTotal: number;
    computedFinalTotal: number;
    items: Array<{ product: any; quantity: number; subtotal: number }>;
  }> {
    let computedTotal = 0;
    const validatedItems: Array<{ product: any; quantity: number; subtotal: number }> = [];

    for (const item of createOrderDto.items) {
      const product = await this.productModel.findById(item.product);
      if (!product) {
        throw new NotFoundException(`Product ${item.product} not found`);
      }

      // Compute subtotal server-side based on actual product price
      const actualSubtotal = product.sellingPrice * item.quantity;
      computedTotal += actualSubtotal;

      validatedItems.push({
        product: item.product,
        quantity: item.quantity,
        subtotal: actualSubtotal, // Use server-computed subtotal
      });
    }

    // Compute final total with tax and discount
    const computedFinalTotal = computedTotal + createOrderDto.tax - (createOrderDto.discount || 0);

    // Validate against client-provided values (with small tolerance for rounding)
    const tolerance = 0.01;
    if (Math.abs(computedTotal - createOrderDto.total) > tolerance) {
      this.logger.warn(
        `Total mismatch detected. Client: ${createOrderDto.total}, Server: ${computedTotal}`,
      );
      throw new BadRequestException(
        `Total validation failed. Expected: ${computedTotal.toFixed(2)}, Received: ${createOrderDto.total}`,
      );
    }

    if (Math.abs(computedFinalTotal - createOrderDto.finalTotal) > tolerance) {
      this.logger.warn(
        `Final total mismatch detected. Client: ${createOrderDto.finalTotal}, Server: ${computedFinalTotal}`,
      );
      throw new BadRequestException(
        `Final total validation failed. Expected: ${computedFinalTotal.toFixed(2)}, Received: ${createOrderDto.finalTotal}`,
      );
    }

    return {
      computedTotal,
      computedFinalTotal,
      items: validatedItems,
    };
  }

  /**
   * Creates an order with transactional consistency
   * Uses MongoDB transactions to ensure atomicity across multiple documents
   * Implements atomic stock operations to prevent race conditions
   */
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    this.logger.log(`Creating new order with ${createOrderDto.items?.length || 0} items`);

    // Validate input data
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Validate and compute totals server-side
    const { computedTotal, computedFinalTotal, items } = 
      await this.validateAndComputeTotals(createOrderDto);

    // Check if transactions are supported (requires replica set)
    const supportsTransactions = this.connection.readyState === 1 && 
      this.connection.db?.admin !== undefined;

    if (supportsTransactions) {
      return this.createWithTransaction(createOrderDto, items, computedTotal, computedFinalTotal);
    } else {
      this.logger.warn(
        'MongoDB transactions not available. Using atomic operations with best-effort consistency.',
      );
      return this.createWithAtomicOps(createOrderDto, items, computedTotal, computedFinalTotal);
    }
  }

  /**
   * Creates order using MongoDB transactions for full ACID compliance
   */
  private async createWithTransaction(
    createOrderDto: CreateOrderDto,
    items: Array<{ product: any; quantity: number; subtotal: number }>,
    computedTotal: number,
    computedFinalTotal: number,
  ): Promise<Order> {
    const session: ClientSession = await this.connection.startSession();
    
    try {
      session.startTransaction();
      this.logger.debug('Transaction started');

      // Validate stock availability and update atomically
      for (const item of items) {
        // Use findOneAndUpdate with conditions to ensure stock is sufficient
        // This is atomic and prevents race conditions
        const updatedProduct = await this.productModel.findOneAndUpdate(
          {
            _id: item.product,
            stock: { $gte: item.quantity }, // Only update if stock is sufficient
          },
          {
            $inc: { stock: -item.quantity }, // Atomic decrement
          },
          { session, new: true },
        );

        if (!updatedProduct) {
          const product = await this.productModel.findById(item.product).session(session);
          if (!product) {
            throw new NotFoundException(`Product ${item.product} not found`);
          }
          throw new BadRequestException(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`,
          );
        }

        this.logger.debug(
          `Stock updated for product ${updatedProduct.name}: ${updatedProduct.stock + item.quantity} -> ${updatedProduct.stock}`,
        );
      }

      // Create order with computed totals
      const orderData = applyDefaults(
        {
          ...createOrderDto,
          items,
          total: computedTotal,
          finalTotal: computedFinalTotal,
        },
        DEFAULT_VALUES.order,
      );
      
      const [createdOrder] = await this.orderModel.create([orderData], { session });
      this.logger.debug(`Order created with ID: ${createdOrder._id}`);

      // Create stock movements
      for (const item of items) {
        await this.stockService.recordMovementWithSession(
          item.product,
          item.quantity,
          'out',
          `Sale - Order #${(createdOrder._id as any).toString()}`,
          session,
          (createdOrder._id as any).toString(),
        );
      }

      await session.commitTransaction();
      this.logger.log(`Order ${createdOrder._id} created successfully with transaction`);

      return createdOrder;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Transaction failed and rolled back: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Creates order using atomic operations (fallback when transactions unavailable)
   * Still provides race condition protection via conditional updates
   */
  private async createWithAtomicOps(
    createOrderDto: CreateOrderDto,
    items: Array<{ product: any; quantity: number; subtotal: number }>,
    computedTotal: number,
    computedFinalTotal: number,
  ): Promise<Order> {
    // Validate stock availability with atomic updates
    const updatedProducts: Array<{ product: ProductDocument; quantity: number }> = [];
    
    try {
      for (const item of items) {
        // Use atomic findOneAndUpdate with condition
        const updatedProduct = await this.productModel.findOneAndUpdate(
          {
            _id: item.product,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          { new: true },
        );

        if (!updatedProduct) {
          const product = await this.productModel.findById(item.product);
          if (!product) {
            throw new NotFoundException(`Product ${item.product} not found`);
          }
          throw new BadRequestException(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`,
          );
        }

        updatedProducts.push({ product: updatedProduct, quantity: item.quantity });
        this.logger.debug(`Stock updated atomically for product ${updatedProduct.name}`);
      }

      // Create order
      const orderData = applyDefaults(
        {
          ...createOrderDto,
          items,
          total: computedTotal,
          finalTotal: computedFinalTotal,
        },
        DEFAULT_VALUES.order,
      );
      
      const createdOrder = new this.orderModel(orderData);
      await createdOrder.save();
      this.logger.debug(`Order created with ID: ${createdOrder._id}`);

      // Create stock movements
      for (const item of items) {
        await this.stockService.recordMovement(
          item.product,
          item.quantity,
          'out',
          `Sale - Order #${(createdOrder._id as any).toString()}`,
          (createdOrder._id as any).toString(),
        );
      }

      this.logger.log(`Order ${createdOrder._id} created successfully with atomic operations`);
      return createdOrder;
      
    } catch (error) {
      // Rollback stock updates manually if order creation fails
      this.logger.error(`Order creation failed, attempting to rollback stock: ${error.message}`);
      
      for (const { product, quantity } of updatedProducts) {
        try {
          await this.productModel.findByIdAndUpdate(
            product._id,
            { $inc: { stock: quantity } }, // Restore stock
          );
          this.logger.debug(`Stock rolled back for product ${product.name}`);
        } catch (rollbackError) {
          this.logger.error(
            `Failed to rollback stock for product ${product._id}: ${rollbackError.message}`,
          );
        }
      }
      
      throw error;
    }
  }

  async findAll(): Promise<Order[]> {
    this.logger.debug('Fetching all orders');
    return this.orderModel
      .find({ deletedAt: { $exists: false } }) // Exclude soft-deleted orders
      .populate('items.product', 'name sellingPrice costPrice category stock')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Order> {
    const validId = sanitizeObjectId(id, 'Order');
    this.logger.debug(`Fetching order ${validId}`);
    
    const order = await this.orderModel
      .findOne({ _id: validId, deletedAt: { $exists: false } }) // Exclude soft-deleted
      .populate('items.product', 'name sellingPrice costPrice category stock')
      .exec();
    
    if (!order) {
      throw new NotFoundException(`Order with ID ${validId} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const validId = sanitizeObjectId(id, 'Order');
    this.logger.log(`Updating order ${validId}`);
    
    // Apply default values for optional fields
    const orderData = applyDefaults(updateOrderDto, DEFAULT_VALUES.order);
    const updatedOrder = await this.orderModel
      .findOneAndUpdate(
        { _id: validId, deletedAt: { $exists: false } }, // Only update if not deleted
        orderData, 
        { new: true }
      )
      .populate('items.product', 'name sellingPrice costPrice category stock')
      .exec();
      
    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${validId} not found`);
    }
    
    this.logger.log(`Order ${validId} updated successfully`);
    return updatedOrder;
  }

  /**
   * Soft delete an order (recommended for audit trail)
   * Sets deletedAt timestamp instead of removing the document
   */
  async remove(id: string): Promise<Order> {
    const validId = sanitizeObjectId(id, 'Order');
    this.logger.log(`Soft deleting order ${validId}`);
    
    const deletedOrder = await this.orderModel
      .findByIdAndUpdate(
        validId,
        { deletedAt: new Date() },
        { new: true }
      )
      .exec();
      
    if (!deletedOrder) {
      throw new NotFoundException(`Order with ID ${validId} not found`);
    }
    
    this.logger.log(`Order ${validId} soft deleted successfully`);
    return deletedOrder;
  }

  /**
   * Permanently delete an order (use with caution)
   * This is irreversible and should only be used in specific scenarios
   */
  async hardDelete(id: string): Promise<Order> {
    const validId = sanitizeObjectId(id, 'Order');
    this.logger.warn(`HARD DELETING order ${validId} - This action is irreversible`);
    
    const deletedOrder = await this.orderModel.findByIdAndDelete(validId).exec();
    if (!deletedOrder) {
      throw new NotFoundException(`Order with ID ${validId} not found`);
    }
    
    this.logger.warn(`Order ${validId} permanently deleted`);
    return deletedOrder;
  }

  /**
   * Restore a soft-deleted order
   */
  async restore(id: string): Promise<Order> {
    const validId = sanitizeObjectId(id, 'Order');
    this.logger.log(`Restoring order ${validId}`);
    
    const restoredOrder = await this.orderModel
      .findByIdAndUpdate(
        validId,
        { $unset: { deletedAt: 1 } },
        { new: true }
      )
      .exec();
      
    if (!restoredOrder) {
      throw new NotFoundException(`Order with ID ${validId} not found`);
    }
    
    this.logger.log(`Order ${validId} restored successfully`);
    return restoredOrder;
  }
}
