import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovement, StockMovementDocument } from '../schemas/stock.schema';

@Injectable()
export class StockService {
  constructor(
    @InjectModel(StockMovement.name)
    private stockMovementModel: Model<StockMovementDocument>,
  ) {}

  async recordMovement(
    productId: string,
    quantity: number,
    type: 'IN' | 'OUT',
    reference?: string,
  ): Promise<StockMovement> {
    const movement = new this.stockMovementModel({
      productId,
      quantity,
      type,
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

  async getCurrentStock(productId: string): Promise<number> {
    const movements = await this.stockMovementModel.find({ productId }).exec();

    return movements.reduce((total, movement) => {
      return (
        total +
        (movement.type === 'IN' ? movement.quantity : -movement.quantity)
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
