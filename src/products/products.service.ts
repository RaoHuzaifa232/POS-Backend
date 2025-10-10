import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { applyDefaults, DEFAULT_VALUES } from '../common/utils/field-defaults.util';
import { sanitizeObjectId } from '../common/utils/validation.util';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    this.logger.log(`Creating new product: ${createProductDto.name}`);
    
    // Apply default values for optional fields
    const productData = applyDefaults(createProductDto, DEFAULT_VALUES.product);
    const createdProduct = new this.productModel(productData);
    const savedProduct = await createdProduct.save();
    
    this.logger.log(`Product created with ID: ${savedProduct._id}`);
    return savedProduct;
  }

  async findAll(): Promise<Product[]> {
    this.logger.debug('Fetching all products');
    return this.productModel.find({ deletedAt: { $exists: false } }).exec();
  }

  async findOne(id: string): Promise<Product> {
    const validId = sanitizeObjectId(id, 'Product');
    this.logger.debug(`Fetching product ${validId}`);
    
    const product = await this.productModel
      .findOne({ _id: validId, deletedAt: { $exists: false } })
      .exec();
      
    if (!product) {
      throw new NotFoundException(`Product with ID ${validId} not found`);
    }
    return product;
  }

  async search(query: string): Promise<Product[]> {
    if (!query || query.trim() === '') {
      return this.findAll();
    }

    this.logger.debug(`Searching products with query: ${query}`);
    const searchRegex = new RegExp(query, 'i');
    return this.productModel.find({
      deletedAt: { $exists: false },
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { barcode: query },
        { supplier: searchRegex },
      ],
    }).exec();
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.productModel.find({ category, deletedAt: { $exists: false } }).exec();
  }

  async findBySupplier(supplier: string): Promise<Product[]> {
    return this.productModel.find({ supplier, deletedAt: { $exists: false } }).exec();
  }

  async findLowStock(): Promise<Product[]> {
    this.logger.debug('Fetching low stock products');
    return this.productModel.find({ 
      deletedAt: { $exists: false },
      $expr: { $lte: ['$stock', '$minStock'] } 
    }).exec();
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const validId = sanitizeObjectId(id, 'Product');
    this.logger.log(`Updating product ${validId}`);
    
    // Apply default values for optional fields that are being updated
    const productData = applyDefaults(updateProductDto, DEFAULT_VALUES.product);
    const updatedProduct = await this.productModel
      .findOneAndUpdate(
        { _id: validId, deletedAt: { $exists: false } },
        productData, 
        { new: true }
      )
      .exec();
      
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${validId} not found`);
    }
    
    this.logger.log(`Product ${validId} updated successfully`);
    return updatedProduct;
  }

  /**
   * Soft delete a product (recommended for audit trail)
   */
  async remove(id: string): Promise<Product> {
    const validId = sanitizeObjectId(id, 'Product');
    this.logger.log(`Soft deleting product ${validId}`);
    
    const deletedProduct = await this.productModel
      .findByIdAndUpdate(
        validId,
        { deletedAt: new Date() },
        { new: true }
      )
      .exec();
      
    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID ${validId} not found`);
    }
    
    this.logger.log(`Product ${validId} soft deleted successfully`);
    return deletedProduct;
  }

  /**
   * Permanently delete a product (use with caution)
   */
  async hardDelete(id: string): Promise<Product> {
    const validId = sanitizeObjectId(id, 'Product');
    this.logger.warn(`HARD DELETING product ${validId} - This action is irreversible`);
    
    const deletedProduct = await this.productModel.findByIdAndDelete(validId).exec();
    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID ${validId} not found`);
    }
    
    this.logger.warn(`Product ${validId} permanently deleted`);
    return deletedProduct;
  }

  /**
   * Restore a soft-deleted product
   */
  async restore(id: string): Promise<Product> {
    const validId = sanitizeObjectId(id, 'Product');
    this.logger.log(`Restoring product ${validId}`);
    
    const restoredProduct = await this.productModel
      .findByIdAndUpdate(
        validId,
        { $unset: { deletedAt: 1 } },
        { new: true }
      )
      .exec();
      
    if (!restoredProduct) {
      throw new NotFoundException(`Product with ID ${validId} not found`);
    }
    
    this.logger.log(`Product ${validId} restored successfully`);
    return restoredProduct;
  }
}
