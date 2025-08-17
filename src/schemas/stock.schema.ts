import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class StockMovement {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, enum: ['IN', 'OUT'] })
  type: string;

  @Prop()
  reference: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export type StockMovementDocument = StockMovement & Document;
export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
