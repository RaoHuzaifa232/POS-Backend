import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ProductSchema } from '../schemas/product.schema';
import { PurchaseSchema } from '../schemas/purchase.schema';
import { OrderSchema } from '../schemas/order.schema';
import { StockMovementSchema } from '../schemas/stock-movement.schema';
import { CategorySchema } from '../schemas/category.schema';
import { SupplierSchema } from '../schemas/supplier.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Product', schema: ProductSchema },
      { name: 'Purchase', schema: PurchaseSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'StockMovement', schema: StockMovementSchema },
      { name: 'Category', schema: CategorySchema },
      { name: 'Supplier', schema: SupplierSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}