import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class StockMovement {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, enum: ['in', 'out', 'adjustment'] })
  type: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  reason: string;

  @Prop()
  reference?: string;
}

export type StockMovementDocument = StockMovement & Document;
export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
