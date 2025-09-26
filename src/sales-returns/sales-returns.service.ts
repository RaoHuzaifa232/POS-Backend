import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalesReturn, SalesReturnDocument } from '../schemas/sales-return.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreateSalesReturnDto } from './dto/create-sales-return.dto';
import { UpdateSalesReturnDto } from './dto/update-sales-return.dto';
import { StockService } from '../stock/stock.service';

@Injectable()
export class SalesReturnsService {
  constructor(
    @InjectModel(SalesReturn.name) private salesReturnModel: Model<SalesReturnDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private stockService: StockService,
  ) {}

  async create(createSalesReturnDto: CreateSalesReturnDto): Promise<SalesReturn> {
    const createdSalesReturn = new this.salesReturnModel(createSalesReturnDto);
    await createdSalesReturn.save();

    // If approved immediately, adjust stock
    if (createSalesReturnDto.status === 'approved') {
      await this.productModel.findByIdAndUpdate(
        createSalesReturnDto.productId,
        { $inc: { stock: createSalesReturnDto.quantity } }
      );

      await this.stockService.recordMovement(
        createSalesReturnDto.productId,
        createSalesReturnDto.quantity,
        'in',
        `Sales return - ${createSalesReturnDto.reason}`,
        (createdSalesReturn._id as any).toString(),
      );
    }

    return createdSalesReturn;
  }

  async findAll(): Promise<SalesReturn[]> {
    return this.salesReturnModel.find().sort({ createdAt: -1 }).exec();
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
    const existingSalesReturn = await this.salesReturnModel.findById(id);
    if (!existingSalesReturn) {
      throw new NotFoundException(`Sales return with ID ${id} not found`);
    }

    const oldStatus = existingSalesReturn.status;
    const newStatus = updateSalesReturnDto.status || oldStatus;

    // Handle status changes
    if (newStatus !== oldStatus) {
      if (newStatus === 'approved' && oldStatus !== 'approved') {
        // Approve return - add stock back
        await this.productModel.findByIdAndUpdate(
          existingSalesReturn.productId,
          { $inc: { stock: existingSalesReturn.quantity } }
        );

        await this.stockService.recordMovement(
          existingSalesReturn.productId,
          existingSalesReturn.quantity,
          'in',
          `Sales return approved - ${existingSalesReturn.reason}`,
          id,
        );
      } else if (oldStatus === 'approved' && newStatus !== 'approved') {
        // Unapprove return - remove stock
        await this.productModel.findByIdAndUpdate(
          existingSalesReturn.productId,
          { $inc: { stock: -existingSalesReturn.quantity } }
        );

        await this.stockService.recordMovement(
          existingSalesReturn.productId,
          existingSalesReturn.quantity,
          'out',
          `Sales return unapproved - ${existingSalesReturn.reason}`,
          id,
        );
      }
    }

    const updatedSalesReturn = await this.salesReturnModel
      .findByIdAndUpdate(id, updateSalesReturnDto, { new: true })
      .exec();

    if (!updatedSalesReturn) {
      throw new NotFoundException(`Sales return with ID ${id} not found`);
    }

    return updatedSalesReturn;
  }

  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<SalesReturn> {
    return this.update(id, { status });
  }

  async remove(id: string): Promise<SalesReturn> {
    const returnToDelete = await this.salesReturnModel.findById(id);
    if (!returnToDelete) {
      throw new NotFoundException(`Sales return with ID ${id} not found`);
    }

    // If it was approved, reverse the stock adjustment
    if (returnToDelete.status === 'approved') {
      await this.productModel.findByIdAndUpdate(
        returnToDelete.productId,
        { $inc: { stock: -returnToDelete.quantity } }
      );

      await this.stockService.recordMovement(
        returnToDelete.productId,
        returnToDelete.quantity,
        'out',
        `Sales return deleted - ${returnToDelete.reason}`,
        id,
      );
    }

    await this.salesReturnModel.findByIdAndDelete(id);
    return returnToDelete;
  }
}
