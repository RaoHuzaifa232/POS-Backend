import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../schemas/product.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Purchase, PurchaseSchema } from '../schemas/purchase.schema';
import { SalesReturn, SalesReturnSchema } from '../schemas/sales-return.schema';
import { PurchaseReturn, PurchaseReturnSchema } from '../schemas/purchase-return.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: SalesReturn.name, schema: SalesReturnSchema },
      { name: PurchaseReturn.name, schema: PurchaseReturnSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
