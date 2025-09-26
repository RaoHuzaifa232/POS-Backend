import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseSchema } from '../schemas/purchase.schema';
import { ProductSchema } from '../schemas/product.schema';
import { StockMovementSchema } from '../schemas/stock-movement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Purchase', schema: PurchaseSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'StockMovement', schema: StockMovementSchema },
    ]),
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}
