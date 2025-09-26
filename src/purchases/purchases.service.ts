import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Purchase, PurchaseDocument } from '../schemas/purchase.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { StockMovement, StockMovementDocument } from '../schemas/stock-movement.schema';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(StockMovement.name) private stockMovementModel: Model<StockMovementDocument>,
  ) {}

  async create(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    // Create the purchase
    const createdPurchase = new this.purchaseModel(createPurchaseDto);
    const savedPurchase = await createdPurchase.save();

    // Update product stock
    await this.updateProductStock(
      createPurchaseDto.productId,
      createPurchaseDto.quantity,
      'IN'
    );

    // Create stock movement record
    await this.createStockMovement(
      createPurchaseDto.productId,
      createPurchaseDto.productName,
      'IN',
      createPurchaseDto.quantity,
      `Purchase from ${createPurchaseDto.supplier}`,
      (savedPurchase._id as any).toString()
    );

    return savedPurchase;
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
    const existingPurchase = await this.purchaseModel.findById(id).exec();
    if (!existingPurchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }

    // Handle quantity changes
    if (updatePurchaseDto.quantity && updatePurchaseDto.quantity !== existingPurchase.quantity) {
      const quantityDifference = updatePurchaseDto.quantity - existingPurchase.quantity;
      
      // Update product stock
      await this.updateProductStock(
        existingPurchase.productId,
        Math.abs(quantityDifference),
        quantityDifference > 0 ? 'IN' : 'OUT'
      );

      // Create stock movement record
      await this.createStockMovement(
        existingPurchase.productId,
        existingPurchase.productName,
        quantityDifference > 0 ? 'IN' : 'OUT',
        Math.abs(quantityDifference),
        `Purchase adjustment - ${existingPurchase.supplier}`,
        id
      );
    }

    const updatedPurchase = await this.purchaseModel
      .findByIdAndUpdate(id, updatePurchaseDto, { new: true })
      .exec();
    
    if (!updatedPurchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }
    
    return updatedPurchase;
  }

  async remove(id: string): Promise<Purchase> {
    const purchaseToDelete = await this.purchaseModel.findById(id).exec();
    if (!purchaseToDelete) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }

    // Reverse the stock increase from this purchase
    await this.updateProductStock(
      purchaseToDelete.productId,
      purchaseToDelete.quantity,
      'OUT'
    );

    // Create stock movement record for the reversal
    await this.createStockMovement(
      purchaseToDelete.productId,
      purchaseToDelete.productName,
      'OUT',
      purchaseToDelete.quantity,
      `Purchase deleted - ${purchaseToDelete.supplier}`,
      id
    );

    const deletedPurchase = await this.purchaseModel.findByIdAndDelete(id).exec();
    if (!deletedPurchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }
    return deletedPurchase;
  }

  // Helper method to update product stock
  private async updateProductStock(
    productId: string,
    quantity: number,
    type: 'IN' | 'OUT'
  ): Promise<void> {
    const product = await this.productModel.findById(productId).exec();
    if (product) {
      const newStock = type === 'IN' 
        ? product.stock + quantity 
        : Math.max(0, product.stock - quantity);
      
      await this.productModel.findByIdAndUpdate(
        productId,
        { stock: newStock },
        { new: true }
      ).exec();
    }
  }

  // Helper method to create stock movement
  private async createStockMovement(
    productId: string,
    productName: string,
    type: 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: number,
    reason: string,
    reference?: string
  ): Promise<void> {
    const stockMovement = new this.stockMovementModel({
      productId,
      productName,
      type,
      quantity,
      reason,
      reference,
      timestamp: new Date()
    });
    
    await stockMovement.save();
  }
}
