import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalesReturn, SalesReturnDocument } from '../schemas/sales-return.schema';
import { CreateSalesReturnDto } from './dto/create-sales-return.dto';
import { UpdateSalesReturnDto } from './dto/update-sales-return.dto';

@Injectable()
export class SalesReturnsService {
  constructor(
    @InjectModel(SalesReturn.name) private salesReturnModel: Model<SalesReturnDocument>,
  ) {}

  async create(createSalesReturnDto: CreateSalesReturnDto): Promise<SalesReturn> {
    const createdSalesReturn = new this.salesReturnModel(createSalesReturnDto);
    return createdSalesReturn.save();
  }

  async findAll(): Promise<SalesReturn[]> {
    return this.salesReturnModel.find().exec();
  }

  async findOne(id: string): Promise<SalesReturn> {
    const salesReturn = await this.salesReturnModel.findById(id).exec();
    if (!salesReturn) {
      throw new NotFoundException(`Sales return with ID ${id} not found`);
    }
    return salesReturn;
  }

  async update(
    id: string,
    updateSalesReturnDto: UpdateSalesReturnDto,
  ): Promise<SalesReturn> {
    const updatedSalesReturn = await this.salesReturnModel
      .findByIdAndUpdate(id, updateSalesReturnDto, { new: true })
      .exec();
    if (!updatedSalesReturn) {
      throw new NotFoundException(`Sales return with ID ${id} not found`);
    }
    return updatedSalesReturn;
  }

  async remove(id: string): Promise<SalesReturn> {
    const deletedSalesReturn = await this.salesReturnModel.findByIdAndDelete(id).exec();
    if (!deletedSalesReturn) {
      throw new NotFoundException(`Sales return with ID ${id} not found`);
    }
    return deletedSalesReturn;
  }
}
