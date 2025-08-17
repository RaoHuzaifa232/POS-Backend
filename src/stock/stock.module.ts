import { Module } from '@nestjs/common';
import { StockController } from '../stock/stock.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StockMovement, StockMovementSchema } from 'src/schemas/stock.schema';
import { ProductsModule } from 'src/products/products.module';
import { StockService } from './stock.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockMovement.name, schema: StockMovementSchema },
    ]),
    ProductsModule,
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
