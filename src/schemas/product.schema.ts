import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  sellingPrice: number;

  @Prop({ required: true })
  costPrice: number;

  @Prop({ required: true })
  category: string;

  @Prop()
  image?: string;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ required: true, default: 0 })
  minStock: number;

  @Prop()
  barcode?: string;

  @Prop()
  supplier?: string;

  @Prop()
  description?: string;
}

export type ProductDocument = Product & Document;
export const ProductSchema = SchemaFactory.createForClass(Product);
