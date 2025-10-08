import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SalesReturn {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  returnDate: Date;

  @Prop({ default: '' })
  customerName?: string;

  @Prop({ default: '' })
  notes?: string;

  @Prop({ required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: string;
}

export type SalesReturnDocument = SalesReturn & Document;
export const SalesReturnSchema = SchemaFactory.createForClass(SalesReturn);
