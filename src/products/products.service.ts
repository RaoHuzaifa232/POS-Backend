import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { applyDefaults, DEFAULT_VALUES } from '../common/utils/field-defaults.util';
import { sanitizeObjectId } from '../common/utils/validation.util';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Apply default values for optional fields
    const productData = applyDefaults(createProductDto, DEFAULT_VALUES.product);
    const createdProduct = new this.productModel(productData);
    return createdProduct.save();
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findOne(id: string): Promise<Product> {
    const validId = sanitizeObjectId(id, 'Product');
    const product = await this.productModel.findById(validId).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${validId} not found`);
    }
    return product;
  }

  async search(query: string): Promise<Product[]> {
    if (!query || query.trim() === '') {
      return this.findAll();
    }

    const searchRegex = new RegExp(query, 'i');
    return this.productModel.find({
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
    return this.productModel.find({ category }).exec();
  }

  async findBySupplier(supplier: string): Promise<Product[]> {
    return this.productModel.find({ supplier }).exec();
  }

  async findLowStock(): Promise<Product[]> {
    return this.productModel.find({ $expr: { $lte: ['$stock', '$minStock'] } }).exec();
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const validId = sanitizeObjectId(id, 'Product');
    // Apply default values for optional fields that are being updated
    const productData = applyDefaults(updateProductDto, DEFAULT_VALUES.product);
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(validId, productData, { new: true })
      .exec();
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${validId} not found`);
    }
    return updatedProduct;
  }

  async remove(id: string): Promise<Product> {
    const validId = sanitizeObjectId(id, 'Product');
    const deletedProduct = await this.productModel.findByIdAndDelete(validId).exec();
    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID ${validId} not found`);
    }
    return deletedProduct;
  }
}
