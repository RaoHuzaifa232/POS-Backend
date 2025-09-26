import { Module } from '@nestjs/common';
import { SalesReturnsController } from './sales-returns.controller';
import { SalesReturnsService } from './sales-returns.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesReturn, SalesReturnSchema } from '../schemas/sales-return.schema';
import { Product, ProductSchema } from '../schemas/product.schema';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SalesReturn.name, schema: SalesReturnSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    StockModule,
  ],
  controllers: [SalesReturnsController],
  providers: [SalesReturnsService],
  exports: [SalesReturnsService],
})
export class SalesReturnsModule {}
