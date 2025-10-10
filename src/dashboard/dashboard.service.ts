import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Purchase, PurchaseDocument } from '../schemas/purchase.schema';
import { SalesReturn, SalesReturnDocument } from '../schemas/sales-return.schema';
import { PurchaseReturn, PurchaseReturnDocument } from '../schemas/purchase-return.schema';

export interface InventoryReport {
  totalProducts: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalSales: number;
  totalPurchases: number;
  totalSalesReturns: number;
  totalPurchaseReturns: number;
  profit: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(SalesReturn.name) private salesReturnModel: Model<SalesReturnDocument>,
    @InjectModel(PurchaseReturn.name) private purchaseReturnModel: Model<PurchaseReturnDocument>,
  ) {}

  async getInventoryReport(): Promise<InventoryReport> {
    const [
      totalProducts,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
      salesData,
      purchaseData,
      salesReturnsData,
      purchaseReturnsData
    ] = await Promise.all([
      this.productModel.countDocuments(),
      this.productModel.aggregate([
        { $group: { _id: null, total: { $sum: { $multiply: ['$stock', '$costPrice'] } } } }
      ]),
      this.productModel.countDocuments({ $expr: { $lte: ['$stock', '$minStock'] } }),
      this.productModel.countDocuments({ stock: 0 }),
      this.orderModel.aggregate([
        { $match: { type: 'sale' } },
        { $group: { _id: null, total: { $sum: '$finalTotal' } } }
      ]),
      this.purchaseModel.aggregate([
        { $group: { _id: null, total: { $sum: '$totalCost' } } }
      ]),
      this.salesReturnModel.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      this.purchaseReturnModel.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const totalSales = salesData[0]?.total || 0;
    const totalPurchases = purchaseData[0]?.total || 0;
    const totalSalesReturns = salesReturnsData[0]?.total || 0;
    const totalPurchaseReturns = purchaseReturnsData[0]?.total || 0;

    return {
      totalProducts,
      totalStockValue: totalStockValue[0]?.total || 0,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      totalSales,
      totalPurchases,
      totalSalesReturns,
      totalPurchaseReturns,
      profit: totalSales - totalPurchases + totalPurchaseReturns - totalSalesReturns,
    };
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.productModel.find({ $expr: { $lte: ['$stock', '$minStock'] } }).exec();
  }

  async getOutOfStockProducts(): Promise<Product[]> {
    return this.productModel.find({ stock: 0 }).exec();
  }

  async getSalesSummary(period?: string, startDate?: string, endDate?: string) {
    let start: Date;
    let end: Date;

    // If custom date range is provided, use it
    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Otherwise, use period (default: 30d)
      const days = parseInt((period || '30d').replace('d', ''));
      start = new Date();
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    return this.orderModel.aggregate([
      { $match: { type: 'sale', createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$finalTotal' },
          orderCount: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  async getTopProducts(limit: number = 10) {
    return this.orderModel.aggregate([
      { $match: { type: 'sale' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          totalQuantity: 1,
          totalRevenue: 1,
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit }
    ]);
  }
}
