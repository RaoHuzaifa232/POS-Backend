import { Module } from '@nestjs/common';
import { OrdersController } from '../orders/orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from 'src/products/products.module';
import { StockModule } from 'src/stock/stock.module';
import { Order, OrderSchema } from 'src/schemas/order.schema';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ProductsModule,
    StockModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
