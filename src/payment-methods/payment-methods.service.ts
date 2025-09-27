import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentMethod, PaymentMethodDocument } from '../schemas/payment-method.schema';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { applyDefaults, DEFAULT_VALUES } from '../common/utils/field-defaults.util';
import { sanitizeObjectId } from '../common/utils/validation.util';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectModel(PaymentMethod.name) private paymentMethodModel: Model<PaymentMethodDocument>,
  ) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    // Apply default values for optional fields
    const paymentMethodData = applyDefaults(createPaymentMethodDto, DEFAULT_VALUES.paymentMethod);
    const createdPaymentMethod = new this.paymentMethodModel(paymentMethodData);
    return createdPaymentMethod.save();
  }

  async findAll(): Promise<PaymentMethod[]> {
    return this.paymentMethodModel.find().exec();
  }

  async findActive(): Promise<PaymentMethod[]> {
    return this.paymentMethodModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<PaymentMethod> {
    const validId = sanitizeObjectId(id, 'PaymentMethod');
    const paymentMethod = await this.paymentMethodModel.findById(validId).exec();
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${validId} not found`);
    }
    return paymentMethod;
  }

  async update(id: string, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    const validId = sanitizeObjectId(id, 'PaymentMethod');
    // Apply default values for optional fields
    const paymentMethodData = applyDefaults(updatePaymentMethodDto, DEFAULT_VALUES.paymentMethod);
    const updatedPaymentMethod = await this.paymentMethodModel
      .findByIdAndUpdate(validId, paymentMethodData, { new: true })
      .exec();
    if (!updatedPaymentMethod) {
      throw new NotFoundException(`Payment method with ID ${validId} not found`);
    }
    return updatedPaymentMethod;
  }

  async remove(id: string): Promise<PaymentMethod> {
    const validId = sanitizeObjectId(id, 'PaymentMethod');
    const deletedPaymentMethod = await this.paymentMethodModel.findByIdAndDelete(validId).exec();
    if (!deletedPaymentMethod) {
      throw new NotFoundException(`Payment method with ID ${validId} not found`);
    }
    return deletedPaymentMethod;
  }
}
