import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { OrdersModule } from './orders/orders.module';
import { StockModule } from './stock/stock.module';
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/pos'),
    ProductsModule,
    CategoriesModule,
    SuppliersModule,
    OrdersModule,
    StockModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
