import { Module } from '@nestjs/common';
import { PurchaseReturnsController } from './purchase-returns.controller';
import { PurchaseReturnsService } from './purchase-returns.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseReturnSchema } from '../schemas/purchase-return.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'PurchaseReturn', schema: PurchaseReturnSchema }]),
  ],
  controllers: [PurchaseReturnsController],
  providers: [PurchaseReturnsService],
})
export class PurchaseReturnsModule {}
