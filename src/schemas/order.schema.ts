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
}

export type OrderDocument = Order & Document;
export const OrderSchema = SchemaFactory.createForClass(Order);
