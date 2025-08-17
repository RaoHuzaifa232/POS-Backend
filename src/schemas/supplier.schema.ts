import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Supplier {
  @Prop({ required: true })
  name: string;

  @Prop()
  address: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export type SupplierDocument = Supplier & Document;
export const SupplierSchema = SchemaFactory.createForClass(Supplier);
