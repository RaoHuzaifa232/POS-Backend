import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export type CategoryDocument = Category & Document;
export const CategorySchema = SchemaFactory.createForClass(Category);
