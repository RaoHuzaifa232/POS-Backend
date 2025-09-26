import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Purchase, PurchaseDocument } from '../schemas/purchase.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { StockMovement, StockMovementDocument } from '../schemas/stock-movement.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { Supplier, SupplierDocument } from '../schemas/supplier.schema';

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalOrders: number;
  totalPurchases: number;
  totalStockValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  recentStockMovements: any[];
  topSellingProducts: any[];
  topSuppliers: any[];
  categoryDistribution: any[];
  stockMovementsSummary: {
    totalIn: number;
    totalOut: number;
    totalAdjustments: number;
  };
  salesSummary: {
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  purchaseSummary: {
    totalPurchases: number;
    totalPurchaseValue: number;
    averagePurchaseValue: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(StockMovement.name) private stockMovementModel: Model<StockMovementDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    // Get basic counts
    const [
      totalProducts,
      totalCategories,
      totalSuppliers,
      totalOrders,
      totalPurchases,
      products,
      purchases,
      orders,
      recentStockMovements,
      stockMovements
    ] = await Promise.all([
      this.productModel.countDocuments().exec(),
      this.categoryModel.countDocuments().exec(),
      this.supplierModel.countDocuments().exec(),
      this.orderModel.countDocuments().exec(),
      this.purchaseModel.countDocuments().exec(),
      this.productModel.find().exec(),
      this.purchaseModel.find().exec(),
      this.orderModel.find().exec(),
      this.stockMovementModel.find().sort({ createdAt: -1 }).limit(10).exec(),
      this.stockMovementModel.find().exec()
    ]);

    // Calculate stock metrics
    const totalStockValue = products.reduce((sum, product) => 
      sum + (product.stock * product.costPrice), 0
    );
    
    const lowStockProducts = products.filter(p => p.stock <= p.minStock).length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;

    // Category distribution
    const categoryDistribution = await this.getCategoryDistribution();

    // Top suppliers by purchase value
    const topSuppliers = await this.getTopSuppliers();

    // Stock movements summary
    const stockMovementsSummary = {
      totalIn: stockMovements.filter(sm => sm.type === 'IN').reduce((sum, sm) => sum + sm.quantity, 0),
      totalOut: stockMovements.filter(sm => sm.type === 'OUT').reduce((sum, sm) => sum + sm.quantity, 0),
      totalAdjustments: stockMovements.filter(sm => sm.type === 'ADJUSTMENT').reduce((sum, sm) => sum + sm.quantity, 0),
    };

    // Sales summary
    const totalRevenue = orders.reduce((sum, order) => sum + order.finalTotal, 0);
    const salesSummary = {
      totalSales: orders.length,
      totalRevenue,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    };

    // Purchase summary
    const totalPurchaseValue = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const purchaseSummary = {
      totalPurchases: purchases.length,
      totalPurchaseValue,
      averagePurchaseValue: purchases.length > 0 ? totalPurchaseValue / purchases.length : 0,
    };

    // Top selling products (based on orders)
    const topSellingProducts = await this.getTopSellingProducts();

    return {
      totalProducts,
      totalCategories,
      totalSuppliers,
      totalOrders,
      totalPurchases,
      totalStockValue,
      lowStockProducts,
      outOfStockProducts,
      recentStockMovements,
      topSellingProducts,
      topSuppliers,
      categoryDistribution,
      stockMovementsSummary,
      salesSummary,
      purchaseSummary,
    };
  }

  private async getCategoryDistribution(): Promise<any[]> {
    const products = await this.productModel.find().exec();
    const categoryMap = new Map();

    products.forEach(product => {
      const category = product.category;
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category) + 1);
      } else {
        categoryMap.set(category, 1);
      }
    });

    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: (count / products.length) * 100
    }));
  }

  private async getTopSuppliers(): Promise<any[]> {
    const purchases = await this.purchaseModel.find().exec();
    const supplierMap = new Map();

    purchases.forEach(purchase => {
      const supplier = purchase.supplier;
      if (supplierMap.has(supplier)) {
        supplierMap.set(supplier, {
          totalValue: supplierMap.get(supplier).totalValue + purchase.totalCost,
          totalPurchases: supplierMap.get(supplier).totalPurchases + 1
        });
      } else {
        supplierMap.set(supplier, {
          totalValue: purchase.totalCost,
          totalPurchases: 1
        });
      }
    });

    return Array.from(supplierMap.entries())
      .map(([supplier, data]) => ({
        supplier,
        totalValue: data.totalValue,
        totalPurchases: data.totalPurchases,
        averageValue: data.totalValue / data.totalPurchases
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  }

  private async getTopSellingProducts(): Promise<any[]> {
    // This would require analyzing order items
    // For now, return products with lowest stock as they might be selling well
    const products = await this.productModel
      .find({ stock: { $gt: 0 } })
      .sort({ stock: 1 })
      .limit(5)
      .exec();

    return products.map(product => ({
      productId: product._id,
      productName: product.name,
      currentStock: product.stock,
      category: product.category,
      supplier: product.supplier
    }));
  }

  async getProductsByCategory(categoryId?: string): Promise<Product[]> {
    const filter = categoryId ? { categoryId } : {};
    return this.productModel.find(filter).exec();
  }

  async getProductsBySupplier(supplierId?: string): Promise<Product[]> {
    const filter = supplierId ? { supplierId } : {};
    return this.productModel.find(filter).exec();
  }

  async getPurchasesBySupplier(supplierId?: string): Promise<Purchase[]> {
    const filter = supplierId ? { supplierId } : {};
    return this.purchaseModel.find(filter).exec();
  }

  async getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
    return this.stockMovementModel.find({ productId }).sort({ createdAt: -1 }).exec();
  }
}