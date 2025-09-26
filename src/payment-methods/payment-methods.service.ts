import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentMethod, PaymentMethodDocument } from '../schemas/payment-method.schema';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectModel(PaymentMethod.name) private paymentMethodModel: Model<PaymentMethodDocument>,
  ) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const createdPaymentMethod = new this.paymentMethodModel(createPaymentMethodDto);
    return createdPaymentMethod.save();
  }

  async findAll(): Promise<PaymentMethod[]> {
    return this.paymentMethodModel.find().exec();
  }

  async findActive(): Promise<PaymentMethod[]> {
    return this.paymentMethodModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodModel.findById(id).exec();
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
    return paymentMethod;
  }

  async update(id: string, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    const updatedPaymentMethod = await this.paymentMethodModel
      .findByIdAndUpdate(id, updatePaymentMethodDto, { new: true })
      .exec();
    if (!updatedPaymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
    return updatedPaymentMethod;
  }

  async remove(id: string): Promise<PaymentMethod> {
    const deletedPaymentMethod = await this.paymentMethodModel.findByIdAndDelete(id).exec();
    if (!deletedPaymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
    return deletedPaymentMethod;
  }
}
