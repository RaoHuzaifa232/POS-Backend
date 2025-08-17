import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PurchaseReturn {
  @Prop({ required: true })
  purchaseId: string;

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

  @Prop({ required: true })
  supplier: string;

  @Prop()
  notes?: string;

  @Prop({ required: true, enum: ['pending', 'approved', 'rejected'] })
  status: string;
}

export type PurchaseReturnDocument = PurchaseReturn & Document;
export const PurchaseReturnSchema = SchemaFactory.createForClass(PurchaseReturn);
