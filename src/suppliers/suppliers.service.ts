import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier, SupplierDocument } from '../schemas/supplier.schema';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { applyDefaults, DEFAULT_VALUES } from '../common/utils/field-defaults.util';
import { sanitizeObjectId } from '../common/utils/validation.util';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    // Apply default values for optional fields
    const supplierData = applyDefaults(createSupplierDto, DEFAULT_VALUES.supplier);
    const createdSupplier = new this.supplierModel(supplierData);
    return createdSupplier.save();
  }

  async findAll(): Promise<Supplier[]> {
    return this.supplierModel.find().exec();
  }

  async findOne(id: string): Promise<Supplier> {
    const validId = sanitizeObjectId(id, 'Supplier');
    const supplier = await this.supplierModel.findById(validId).exec();
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${validId} not found`);
    }
    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
    const validId = sanitizeObjectId(id, 'Supplier');
    // Apply default values for optional fields
    const supplierData = applyDefaults(updateSupplierDto, DEFAULT_VALUES.supplier);
    const updatedSupplier = await this.supplierModel
      .findByIdAndUpdate(validId, supplierData, { new: true })
      .exec();
    if (!updatedSupplier) {
      throw new NotFoundException(`Supplier with ID ${validId} not found`);
    }
    return updatedSupplier;
  }

  async remove(id: string): Promise<Supplier> {
    const validId = sanitizeObjectId(id, 'Supplier');
    const deletedSupplier = await this.supplierModel.findByIdAndDelete(validId).exec();
    if (!deletedSupplier) {
      throw new NotFoundException(`Supplier with ID ${validId} not found`);
    }
    return deletedSupplier;
  }
}
