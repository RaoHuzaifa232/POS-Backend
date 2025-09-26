import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Purchase {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  costPrice: number;

  @Prop({ required: true })
  totalCost: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Supplier' })
  supplierId?: string;

  @Prop({ required: true })
  supplier: string; // Keep for backward compatibility

  @Prop()
  invoiceNumber?: string;

  @Prop({ required: true, default: Date.now })
  purchaseDate: Date;

  @Prop()
  notes?: string;
}

export type PurchaseDocument = Purchase & Document;
export const PurchaseSchema = SchemaFactory.createForClass(Purchase);
