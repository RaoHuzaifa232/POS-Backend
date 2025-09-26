import { Module } from '@nestjs/common';
import { StockController } from '../stock/stock.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StockMovement, StockMovementSchema } from 'src/schemas/stock.schema';
import { Product, ProductSchema } from 'src/schemas/product.schema';
import { StockService } from './stock.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
