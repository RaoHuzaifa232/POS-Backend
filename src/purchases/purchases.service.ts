import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Purchase, PurchaseDocument } from '../schemas/purchase.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { StockService } from '../stock/stock.service';
import { applyDefaults, DEFAULT_VALUES } from '../common/utils/field-defaults.util';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectConnection() private readonly connection: Connection,
    private stockService: StockService,
  ) {}

  /**
   * Creates a purchase with transactional consistency
   */
  async create(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    this.logger.log(`Creating purchase for product ${createPurchaseDto.productId}: ${createPurchaseDto.quantity} units`);

    // Validate product exists
    const product = await this.productModel.findById(createPurchaseDto.productId);
    if (!product) {
      throw new NotFoundException(`Product ${createPurchaseDto.productId} not found`);
    }

    // Check if transactions are supported
    const supportsTransactions = this.connection.readyState === 1 && 
      this.connection.db?.admin !== undefined;

    if (supportsTransactions) {
      return this.createWithTransaction(createPurchaseDto);
    } else {
      this.logger.debug('Using atomic operations for purchase creation');
      return this.createWithAtomicOps(createPurchaseDto);
    }
  }

  /**
   * Creates purchase using MongoDB transactions
   */
  private async createWithTransaction(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    const session: ClientSession = await this.connection.startSession();
    
    try {
      session.startTransaction();
      this.logger.debug('Transaction started for purchase creation');

      // Create purchase
      const purchaseData = applyDefaults(createPurchaseDto, DEFAULT_VALUES.purchase);
      const [createdPurchase] = await this.purchaseModel.create([purchaseData], { session });
      this.logger.debug(`Purchase created with ID: ${createdPurchase._id}`);

      // Update product stock atomically
      const updatedProduct = await this.productModel.findByIdAndUpdate(
        createPurchaseDto.productId,
        { $inc: { stock: createPurchaseDto.quantity } },
        { session, new: true }
      );

      if (!updatedProduct) {
        throw new NotFoundException(`Product ${createPurchaseDto.productId} not found`);
      }

      this.logger.debug(`Stock updated for ${updatedProduct.name}: +${createPurchaseDto.quantity} units`);

      // Create stock movement
      await this.stockService.recordMovementWithSession(
        createPurchaseDto.productId,
        createPurchaseDto.quantity,
        'in',
        `Purchase from ${createPurchaseDto.supplier}`,
        session,
        (createdPurchase._id as any).toString(),
      );

      await session.commitTransaction();
      this.logger.log(`Purchase ${createdPurchase._id} created successfully with transaction`);

      return createdPurchase;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Purchase transaction failed and rolled back: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Creates purchase using atomic operations (fallback)
   */
  private async createWithAtomicOps(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    // Apply default values and create purchase
    const purchaseData = applyDefaults(createPurchaseDto, DEFAULT_VALUES.purchase);
    const createdPurchase = new this.purchaseModel(purchaseData);
    await createdPurchase.save();
    this.logger.debug(`Purchase created with ID: ${createdPurchase._id}`);

    try {
      // Update product stock
      await this.productModel.findByIdAndUpdate(
        createPurchaseDto.productId,
        { $inc: { stock: createPurchaseDto.quantity } }
      );

      // Create stock movement
      await this.stockService.recordMovement(
        createPurchaseDto.productId,
        createPurchaseDto.quantity,
        'in',
        `Purchase from ${createPurchaseDto.supplier}`,
        (createdPurchase._id as any).toString(),
      );

      this.logger.log(`Purchase ${createdPurchase._id} created successfully`);
      return createdPurchase;
    } catch (error) {
      // Rollback: delete the purchase if stock update fails
      this.logger.error(`Purchase creation failed, rolling back: ${error.message}`);
      await this.purchaseModel.findByIdAndDelete(createdPurchase._id);
      throw error;
    }
  }

  async findAll(): Promise<Purchase[]> {
    this.logger.debug('Fetching all purchases');
    return this.purchaseModel
      .find({ deletedAt: { $exists: false } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Purchase> {
    this.logger.debug(`Fetching purchase ${id}`);
    const purchase = await this.purchaseModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .exec();
      
    if (!purchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }
    return purchase;
  }

  async update(
    id: string,
    updatePurchaseDto: UpdatePurchaseDto,
  ): Promise<Purchase> {
    this.logger.log(`Updating purchase ${id}`);
    
    const existingPurchase = await this.purchaseModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .exec();
      
    if (!existingPurchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }

    // If quantity changed, adjust stock accordingly
    if (updatePurchaseDto.quantity !== undefined && 
        updatePurchaseDto.quantity !== existingPurchase.quantity) {
      const quantityDifference = updatePurchaseDto.quantity - existingPurchase.quantity;
      
      this.logger.debug(`Adjusting stock by ${quantityDifference} units`);
      
      await this.productModel.findByIdAndUpdate(
        existingPurchase.productId,
        { $inc: { stock: quantityDifference } }
      );

      // Add stock movement for the adjustment
      await this.stockService.recordMovement(
        existingPurchase.productId,
        Math.abs(quantityDifference),
        quantityDifference > 0 ? 'in' : 'out',
        `Purchase adjustment - ${existingPurchase.supplier}`,
        id,
      );
    }

    // Update the purchase
    const updatedPurchase = await this.purchaseModel
      .findByIdAndUpdate(id, updatePurchaseDto, { new: true })
      .exec();

    if (!updatedPurchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }

    this.logger.log(`Purchase ${id} updated successfully`);
    return updatedPurchase;
  }

  /**
   * Soft delete a purchase (recommended)
   * Note: Does NOT reverse stock changes - use with caution
   */
  async remove(id: string): Promise<Purchase> {
    this.logger.log(`Soft deleting purchase ${id}`);
    
    const deletedPurchase = await this.purchaseModel
      .findByIdAndUpdate(
        id,
        { deletedAt: new Date() },
        { new: true }
      )
      .exec();
      
    if (!deletedPurchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }
    
    this.logger.log(`Purchase ${id} soft deleted successfully`);
    return deletedPurchase;
  }

  /**
   * Hard delete a purchase and reverse stock changes
   */
  async hardDelete(id: string): Promise<Purchase> {
    this.logger.warn(`HARD DELETING purchase ${id} with stock reversal`);
    
    const purchaseToDelete = await this.purchaseModel.findById(id);
    if (!purchaseToDelete) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }

    // Reverse the stock increase from this purchase
    await this.productModel.findByIdAndUpdate(
      purchaseToDelete.productId,
      { $inc: { stock: -purchaseToDelete.quantity } }
    );

    // Add stock movement for the reversal
    await this.stockService.recordMovement(
      purchaseToDelete.productId,
      purchaseToDelete.quantity,
      'out',
      `Purchase deleted - ${purchaseToDelete.supplier}`,
      id,
    );

    // Remove the purchase
    await this.purchaseModel.findByIdAndDelete(id);
    
    this.logger.warn(`Purchase ${id} hard deleted and stock reversed`);
    return purchaseToDelete;
  }

  /**
   * Restore a soft-deleted purchase
   */
  async restore(id: string): Promise<Purchase> {
    this.logger.log(`Restoring purchase ${id}`);
    
    const restoredPurchase = await this.purchaseModel
      .findByIdAndUpdate(
        id,
        { $unset: { deletedAt: 1 } },
        { new: true }
      )
      .exec();
      
    if (!restoredPurchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }
    
    this.logger.log(`Purchase ${id} restored successfully`);
    return restoredPurchase;
  }
}
