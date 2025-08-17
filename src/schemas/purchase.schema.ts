import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Purchase {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  costPrice: number;

  @Prop({ required: true })
  totalCost: number;

  @Prop({ required: true })
  supplier: string;

  @Prop()
  invoiceNumber?: string;

  @Prop({ required: true })
  purchaseDate: Date;

  @Prop()
  notes?: string;
}

export type PurchaseDocument = Purchase & Document;
export const PurchaseSchema = SchemaFactory.createForClass(Purchase);
