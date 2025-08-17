import { Module } from '@nestjs/common';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovementsService } from './stock-movements.service';
import { MongooseModule } from '@nestjs/mongoose';
import { StockMovementSchema } from '../schemas/stock-movement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'StockMovement', schema: StockMovementSchema }]),
  ],
  controllers: [StockMovementsController],
  providers: [StockMovementsService],
})
export class StockMovementsModule {}
