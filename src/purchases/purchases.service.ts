import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Purchase, PurchaseDocument } from '../schemas/purchase.schema';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
  ) {}

  async create(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    const createdPurchase = new this.purchaseModel(createPurchaseDto);
    return createdPurchase.save();
  }

  async findAll(): Promise<Purchase[]> {
    return this.purchaseModel.find().exec();
  }

  async findOne(id: string): Promise<Purchase> {
    const purchase = await this.purchaseModel.findById(id).exec();
    if (!purchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }
    return purchase;
  }

  async update(
    id: string,
    updatePurchaseDto: UpdatePurchaseDto,
  ): Promise<Purchase> {
    const updatedPurchase = await this.purchaseModel
      .findByIdAndUpdate(id, updatePurchaseDto, { new: true })
      .exec();
    if (!updatedPurchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }
    return updatedPurchase;
  }

  async remove(id: string): Promise<Purchase> {
    const deletedPurchase = await this.purchaseModel.findByIdAndDelete(id).exec();
    if (!deletedPurchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }
    return deletedPurchase;
  }
}
