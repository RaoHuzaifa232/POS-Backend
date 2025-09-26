import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  sellingPrice: number;

  @Prop({ required: true })
  costPrice: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  categoryId?: string;

  @Prop({ required: true })
  category: string; // Keep for backward compatibility and easy filtering

  @Prop()
  image?: string;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ required: true, default: 0 })
  minStock: number;

  @Prop()
  barcode?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Supplier' })
  supplierId?: string;

  @Prop()
  supplier?: string; // Keep for backward compatibility and easy filtering

  @Prop()
  description?: string;
}

export type ProductDocument = Product & Document;
export const ProductSchema = SchemaFactory.createForClass(Product);
