import { Module } from '@nestjs/common';
import { SalesReturnsController } from './sales-returns.controller';
import { SalesReturnsService } from './sales-returns.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesReturnSchema } from '../schemas/sales-return.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'SalesReturn', schema: SalesReturnSchema }]),
  ],
  controllers: [SalesReturnsController],
  providers: [SalesReturnsService],
})
export class SalesReturnsModule {}
