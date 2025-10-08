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
  category: string; // Keep for frontend compatibility

  @Prop()
  image?: string;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ required: true, default: 0 })
  minStock: number;

  @Prop({ sparse: true })
  barcode?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Supplier' })
  supplierId?: string;

  @Prop()
  supplier?: string; // Keep for frontend compatibility

  @Prop()
  description?: string;
}

export type ProductDocument = Product & Document;
export const ProductSchema = SchemaFactory.createForClass(Product);

// Transform _id to id for frontend compatibility
ProductSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Add indexes for performance
ProductSchema.index({ barcode: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ supplier: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
