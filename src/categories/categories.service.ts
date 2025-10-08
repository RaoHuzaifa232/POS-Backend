import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { applyDefaults, DEFAULT_VALUES } from '../common/utils/field-defaults.util';
import { sanitizeObjectId } from '../common/utils/validation.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Apply default values for optional fields
    const categoryData = applyDefaults(createCategoryDto, DEFAULT_VALUES.category);
    const createdCategory = new this.categoryModel(categoryData);
    return createdCategory.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }

  async findOne(id: string): Promise<Category> {
    const validId = sanitizeObjectId(id, 'Category');
    const category = await this.categoryModel.findById(validId).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${validId} not found`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const validId = sanitizeObjectId(id, 'Category');
    // Apply default values for optional fields
    const categoryData = applyDefaults(updateCategoryDto, DEFAULT_VALUES.category);
    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(validId, categoryData, { new: true })
      .exec();
    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID ${validId} not found`);
    }
    return updatedCategory;
  }

  async remove(id: string): Promise<Category> {
    const validId = sanitizeObjectId(id, 'Category');
    const deletedCategory = await this.categoryModel
      .findByIdAndDelete(validId)
      .exec();
    if (!deletedCategory) {
      throw new NotFoundException(`Category with ID ${validId} not found`);
    }
    return deletedCategory;
  }
}
