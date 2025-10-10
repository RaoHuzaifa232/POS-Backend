import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { StockMovement, StockMovementDocument } from '../schemas/stock.schema';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @InjectModel(StockMovement.name)
    private stockMovementModel: Model<StockMovementDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  async recordMovement(
    productId: string,
    quantity: number,
    type: 'in' | 'out' | 'adjustment',
    reason: string,
    reference?: string,
  ): Promise<StockMovement> {
    this.logger.debug(`Recording ${type} stock movement for product ${productId}: ${quantity} units`);
    
    // Get product name for the movement record
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const movement = new this.stockMovementModel({
      productId,
      productName: product.name,
      quantity,
      type,
      reason,
      reference,
    });
    
    const savedMovement = await movement.save();
    this.logger.debug(`Stock movement recorded with ID ${savedMovement._id}`);
    
    return savedMovement;
  }

  /**
   * Record stock movement within a transaction session
   * Used for transactional consistency
   */
  async recordMovementWithSession(
    productId: string,
    quantity: number,
    type: 'in' | 'out' | 'adjustment',
    reason: string,
    session: ClientSession,
    reference?: string,
  ): Promise<StockMovement> {
    this.logger.debug(`Recording ${type} stock movement (with session) for product ${productId}: ${quantity} units`);
    
    // Get product name for the movement record
    const product = await this.productModel.findById(productId).session(session);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const [movement] = await this.stockMovementModel.create(
      [
        {
          productId,
          productName: product.name,
          quantity,
          type,
          reason,
          reference,
        },
      ],
      { session },
    );
    
    this.logger.debug(`Stock movement recorded with ID ${movement._id} (in transaction)`);
    return movement;
  }

  async getMovements(productId: string): Promise<StockMovement[]> {
    return this.stockMovementModel
      .find({ productId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAllMovements(): Promise<StockMovement[]> {
    return this.stockMovementModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async getCurrentStock(productId: string): Promise<number> {
    const movements = await this.stockMovementModel.find({ productId }).exec();

    return movements.reduce((total, movement) => {
      return (
        total +
        (movement.type === 'in' ? movement.quantity : -movement.quantity)
      );
    }, 0);
  }

  async findOne(id: string): Promise<StockMovement> {
    const movement = await this.stockMovementModel.findById(id).exec();
    if (!movement) {
      throw new NotFoundException(`Stock movement with ID ${id} not found`);
    }
    return movement;
  }
}
