import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../schemas/product.schema';
import { Category, CategorySchema } from '../schemas/category.schema';
import { Supplier, SupplierSchema } from '../schemas/supplier.schema';
import { PaymentMethod, PaymentMethodSchema } from '../schemas/payment-method.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { SeedService } from './seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: PaymentMethod.name, schema: PaymentMethodSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
