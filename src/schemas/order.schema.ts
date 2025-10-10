import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class CartItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  subtotal: number;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  total: number;

  @Prop({ required: true })
  tax: number;

  @Prop({ required: true, default: 0 })
  discount: number;

  @Prop({ required: true })
  finalTotal: number;

  @Prop({ required: true, enum: ['cash', 'card', 'digital'] })
  paymentMethod: string;

  @Prop()
  customerName?: string;

  @Prop({ required: true, enum: ['sale', 'purchase'] })
  type: string;

  @Prop([CartItem])
  items: CartItem[];

  // Add timestamp field for frontend compatibility
  @Prop({ default: Date.now })
  timestamp: Date;

  // Soft delete support - when set, the order is considered deleted
  @Prop()
  deletedAt?: Date;
}

export type OrderDocument = Order & Document;
export const OrderSchema = SchemaFactory.createForClass(Order);

// Transform _id to id for frontend compatibility
OrderSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});