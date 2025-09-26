import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovement, StockMovementDocument } from '../schemas/stock.schema';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class StockService {
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
    return movement.save();
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
