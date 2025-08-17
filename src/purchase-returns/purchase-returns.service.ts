import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PurchaseReturn, PurchaseReturnDocument } from '../schemas/purchase-return.schema';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
import { UpdatePurchaseReturnDto } from './dto/update-purchase-return.dto';

@Injectable()
export class PurchaseReturnsService {
  constructor(
    @InjectModel(PurchaseReturn.name) private purchaseReturnModel: Model<PurchaseReturnDocument>,
  ) {}

  async create(createPurchaseReturnDto: CreatePurchaseReturnDto): Promise<PurchaseReturn> {
    const createdPurchaseReturn = new this.purchaseReturnModel(createPurchaseReturnDto);
    return createdPurchaseReturn.save();
  }

  async findAll(): Promise<PurchaseReturn[]> {
    return this.purchaseReturnModel.find().exec();
  }

  async findOne(id: string): Promise<PurchaseReturn> {
    const purchaseReturn = await this.purchaseReturnModel.findById(id).exec();
    if (!purchaseReturn) {
      throw new NotFoundException(`Purchase return with ID ${id} not found`);
    }
    return purchaseReturn;
  }

  async update(
    id: string,
    updatePurchaseReturnDto: UpdatePurchaseReturnDto,
  ): Promise<PurchaseReturn> {
    const updatedPurchaseReturn = await this.purchaseReturnModel
      .findByIdAndUpdate(id, updatePurchaseReturnDto, { new: true })
      .exec();
    if (!updatedPurchaseReturn) {
      throw new NotFoundException(`Purchase return with ID ${id} not found`);
    }
    return updatedPurchaseReturn;
  }

  async remove(id: string): Promise<PurchaseReturn> {
    const deletedPurchaseReturn = await this.purchaseReturnModel.findByIdAndDelete(id).exec();
    if (!deletedPurchaseReturn) {
      throw new NotFoundException(`Purchase return with ID ${id} not found`);
    }
    return deletedPurchaseReturn;
  }
}
