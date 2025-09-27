import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { StockService } from '../stock/stock.service';
import { applyDefaults, DEFAULT_VALUES } from '../common/utils/field-defaults.util';
import { sanitizeObjectId } from '../common/utils/validation.util';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private stockService: StockService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Validate input data
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Validate stock availability first
    for (const item of createOrderDto.items) {
      if (!item.product) {
        throw new BadRequestException('Product ID is required for each item');
      }
      
      const product = await this.productModel.findById(item.product);
      if (!product) {
        throw new NotFoundException(`Product ${item.product} not found`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`
        );
      }
    }

    // Apply default values and create order
    const orderData = applyDefaults(createOrderDto, DEFAULT_VALUES.order);
    const createdOrder = new this.orderModel(orderData);
    await createdOrder.save();

    // Update stock and create movements
    for (const item of createOrderDto.items) {
      // Update product stock
      await this.productModel.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );

      // Create stock movement
      await this.stockService.recordMovement(
        item.product,
        item.quantity,
        'out',
        `Sale - Order #${(createdOrder._id as any).toString()}`,
        (createdOrder._id as any).toString(),
      );
    }

    return createdOrder;
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel
      .find()
      .populate('items.product', 'name sellingPrice costPrice category stock')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Order> {
    const validId = sanitizeObjectId(id, 'Order');
    const order = await this.orderModel
      .findById(validId)
      .populate('items.product', 'name sellingPrice costPrice category stock')
      .exec();
    
    if (!order) {
      throw new NotFoundException(`Order with ID ${validId} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const validId = sanitizeObjectId(id, 'Order');
    // Apply default values for optional fields
    const orderData = applyDefaults(updateOrderDto, DEFAULT_VALUES.order);
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(validId, orderData, { new: true })
      .populate('items.product', 'name sellingPrice costPrice category stock')
      .exec();
    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${validId} not found`);
    }
    return updatedOrder;
  }

  async remove(id: string): Promise<Order> {
    const validId = sanitizeObjectId(id, 'Order');
    const deletedOrder = await this.orderModel.findByIdAndDelete(validId).exec();
    if (!deletedOrder) {
      throw new NotFoundException(`Order with ID ${validId} not found`);
    }
    return deletedOrder;
  }
}
