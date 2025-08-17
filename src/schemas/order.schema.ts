import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  price: number;
}

@Schema()
export class Order {
  @Prop({ required: true })
  orderNumber: string;

  @Prop([OrderItem])
  items: OrderItem[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true, enum: ['PENDING', 'COMPLETED', 'CANCELLED'] })
  status: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export type OrderDocument = Order & Document;
export const OrderSchema = SchemaFactory.createForClass(Order);
