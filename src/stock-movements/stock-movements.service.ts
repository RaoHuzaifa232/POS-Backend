import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovement, StockMovementDocument } from '../schemas/stock.schema';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectModel(StockMovement.name) private stockMovementModel: Model<StockMovementDocument>,
  ) {}

  async create(createStockMovementDto: CreateStockMovementDto): Promise<StockMovement> {
    const createdStockMovement = new this.stockMovementModel(createStockMovementDto);
    return createdStockMovement.save();
  }

  async findAll(): Promise<StockMovement[]> {
    return this.stockMovementModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<StockMovement> {
    const stockMovement = await this.stockMovementModel.findById(id).exec();
    if (!stockMovement) {
      throw new NotFoundException(`Stock movement with ID ${id} not found`);
    }
    return stockMovement;
  }

  async update(
    id: string,
    updateStockMovementDto: UpdateStockMovementDto,
  ): Promise<StockMovement> {
    const updatedStockMovement = await this.stockMovementModel
      .findByIdAndUpdate(id, updateStockMovementDto, { new: true })
      .exec();
    if (!updatedStockMovement) {
      throw new NotFoundException(`Stock movement with ID ${id} not found`);
    }
    return updatedStockMovement;
  }

  async remove(id: string): Promise<StockMovement> {
    const deletedStockMovement = await this.stockMovementModel.findByIdAndDelete(id).exec();
    if (!deletedStockMovement) {
      throw new NotFoundException(`Stock movement with ID ${id} not found`);
    }
    return deletedStockMovement;
  }
}
