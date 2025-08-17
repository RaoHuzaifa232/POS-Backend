import { Module } from '@nestjs/common';
import { SuppliersController } from '../suppliers/suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Supplier, SupplierSchema } from 'src/schemas/supplier.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Supplier.name, schema: SupplierSchema },
    ]),
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
})
export class SuppliersModule {}
