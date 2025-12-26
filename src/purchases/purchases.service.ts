import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Purchase, PurchaseDocument } from '../schemas/purchase.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { StockService } from '../stock/stock.service';
import { applyDefaults, DEFAULT_VALUES } from '../common/utils/field-defaults.util';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private stockService: StockService,
  ) {}

  async create(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    // Apply default values and create purchase
    const purchaseData = applyDefaults(createPurchaseDto, DEFAULT_VALUES.purchase);
    const createdPurchase = new this.purchaseModel(purchaseData);
    await createdPurchase.save();

    // Update product stock and cost price with latest purchase price
    await this.productModel.findByIdAndUpdate(
      createPurchaseDto.productId,
      { 
        $inc: { stock: createPurchaseDto.quantity },
        $set: { costPrice: createPurchaseDto.costPrice }
      }
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

    const updateFields: any = {};

    // If quantity changed, adjust stock accordingly
    if (updatePurchaseDto.quantity !== undefined && 
        updatePurchaseDto.quantity !== existingPurchase.quantity) {
      const quantityDifference = updatePurchaseDto.quantity - existingPurchase.quantity;
      updateFields.$inc = { stock: quantityDifference };

      // Add stock movement for the adjustment
      await this.stockService.recordMovement(
        existingPurchase.productId,
        Math.abs(quantityDifference),
        quantityDifference > 0 ? 'in' : 'out',
        `Purchase adjustment - ${existingPurchase.supplier}`,
        id,
      );
    }

    // If cost price changed, update product cost price
    // Check if this is the latest purchase for this product
    if (updatePurchaseDto.costPrice !== undefined) {
      const latestPurchase = await this.purchaseModel
        .findOne({ productId: existingPurchase.productId })
        .sort({ createdAt: -1 })
        .exec();

      // If this is the latest purchase (or will be after update), update product cost price
      if (!latestPurchase || String(latestPurchase._id) === id) {
        if (!updateFields.$set) {
          updateFields.$set = {};
        }
        updateFields.$set.costPrice = updatePurchaseDto.costPrice;
      }
    }

    // Update product if there are changes
    if (Object.keys(updateFields).length > 0) {
      await this.productModel.findByIdAndUpdate(
        existingPurchase.productId,
        updateFields
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

    // Check if this is the latest purchase (before deletion)
    const latestPurchase = await this.purchaseModel
      .findOne({ productId: purchaseToDelete.productId })
      .sort({ createdAt: -1 })
      .exec();

    const isLatestPurchase = latestPurchase && String(latestPurchase._id) === id;

    // Reverse the stock increase from this purchase
    const updateFields: any = {
      $inc: { stock: -purchaseToDelete.quantity }
    };

    // If this is the latest purchase, update cost price to the previous purchase's cost price
    if (isLatestPurchase) {
      const previousPurchase = await this.purchaseModel
        .findOne({ 
          productId: purchaseToDelete.productId,
          _id: { $ne: id }
        })
        .sort({ createdAt: -1 })
        .exec();

      if (previousPurchase) {
        // Use the previous purchase's cost price
        updateFields.$set = { costPrice: previousPurchase.costPrice };
      } else {
        // No other purchases, keep current cost price (or could set to 0)
        // Keeping current is safer in case there are other references
      }
    }

    await this.productModel.findByIdAndUpdate(
      purchaseToDelete.productId,
      updateFields
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
