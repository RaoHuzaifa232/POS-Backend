import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PaymentMethod {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['cash', 'bank', 'digital'] })
  type: string;

  @Prop()
  accountNumber?: string;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export type PaymentMethodDocument = PaymentMethod & Document;
export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);
