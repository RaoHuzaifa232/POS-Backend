import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Purchase, PurchaseDocument } from '../schemas/purchase.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { StockService } from '../stock/stock.service';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private stockService: StockService,
  ) {}

  async create(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    // Create purchase
    const createdPurchase = new this.purchaseModel(createPurchaseDto);
    await createdPurchase.save();

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

    return createdPurchase;
  }

  async findAll(): Promise<Purchase[]> {
    return this.purchaseModel.find().sort({ createdAt: -1 }).exec();
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
    const existingPurchase = await this.purchaseModel.findById(id);
    if (!existingPurchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }

    // If quantity changed, adjust stock accordingly
    if (updatePurchaseDto.quantity !== undefined && 
        updatePurchaseDto.quantity !== existingPurchase.quantity) {
      const quantityDifference = updatePurchaseDto.quantity - existingPurchase.quantity;
      
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

    return updatedPurchase;
  }

  async remove(id: string): Promise<Purchase> {
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
    return purchaseToDelete;
  }
}
