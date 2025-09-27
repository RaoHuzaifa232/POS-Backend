import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { Supplier, SupplierDocument } from '../schemas/supplier.schema';
import { PaymentMethod, PaymentMethodDocument } from '../schemas/payment-method.schema';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
    @InjectModel(PaymentMethod.name) private paymentMethodModel: Model<PaymentMethodDocument>,
  ) {}

  async seedDatabase() {
    return;
    // Check if data already exists
    const productCount = await this.productModel.countDocuments();
    if (productCount > 0) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database with initial data...');

    // Seed Categories
    const categories = await this.categoryModel.insertMany([
      { name: 'Beverages', color: 'bg-blue-500', description: 'Drinks and beverages' },
      { name: 'Food', color: 'bg-green-500', description: 'Food items' },
      { name: 'Snacks', color: 'bg-yellow-500', description: 'Snacks and chips' },
      { name: 'Electronics', color: 'bg-purple-500', description: 'Electronic items' },
    ]);

    // Seed Suppliers
    const suppliers = await this.supplierModel.insertMany([
      { name: 'ABC Distributors', contact: 'John Doe', email: 'john@abc.com', phone: '123-456-7890' },
      { name: 'XYZ Wholesale', contact: 'Jane Smith', email: 'jane@xyz.com', phone: '098-765-4321' },
      { name: 'Tech Supply Co', contact: 'Mike Johnson', email: 'mike@techsupply.com', phone: '555-123-4567' },
    ]);

    // Seed Payment Methods
    await this.paymentMethodModel.insertMany([
      { name: 'Cash', type: 'cash', isActive: true },
      { name: 'Bank Transfer', type: 'bank', accountNumber: '1234567890', isActive: true },
      { name: 'Credit Card', type: 'digital', isActive: true },
      { name: 'Digital Wallet', type: 'digital', isActive: true },
    ]);

    // Seed Products
    await this.productModel.insertMany([
      {
        name: 'Coffee',
        sellingPrice: 4.99,
        costPrice: 2.5,
        category: 'Beverages',
        stock: 50,
        minStock: 10,
        barcode: '123456789',
        supplier: 'ABC Distributors',
        description: 'Premium coffee blend',
      },
      {
        name: 'Sandwich',
        sellingPrice: 8.99,
        costPrice: 4.5,
        category: 'Food',
        stock: 25,
        minStock: 5,
        barcode: '987654321',
        supplier: 'ABC Distributors',
        description: 'Fresh sandwich',
      },
      {
        name: 'Chips',
        sellingPrice: 2.99,
        costPrice: 1.2,
        category: 'Snacks',
        stock: 100,
        minStock: 20,
        barcode: '456789123',
        supplier: 'XYZ Wholesale',
        description: 'Crispy potato chips',
      },
      {
        name: 'Soda',
        sellingPrice: 1.99,
        costPrice: 0.8,
        category: 'Beverages',
        stock: 75,
        minStock: 15,
        barcode: '789123456',
        supplier: 'ABC Distributors',
        description: 'Refreshing soda',
      },
      {
        name: 'Burger',
        sellingPrice: 12.99,
        costPrice: 6.5,
        category: 'Food',
        stock: 20,
        minStock: 5,
        barcode: '321654987',
        supplier: 'ABC Distributors',
        description: 'Delicious burger',
      },
      {
        name: 'Headphones',
        sellingPrice: 29.99,
        costPrice: 15.0,
        category: 'Electronics',
        stock: 15,
        minStock: 3,
        barcode: '654987321',
        supplier: 'Tech Supply Co',
        description: 'Wireless headphones',
      },
    ]);

    console.log('✅ Database seeded successfully');
  }
}
