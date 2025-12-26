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
  totalRevenue: number;
  totalPurchases: number;
  totalSalesReturns: number;
  totalPurchaseReturns: number;
  grossProfit: number;
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

  async getInventoryReport(period?: string, startDate?: string, endDate?: string): Promise<InventoryReport> {
    // Build date filter
    let dateRange: { $gte: Date; $lte: Date } | null = null;
    
    if (startDate && endDate) {
      // Custom date range
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Start of day
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      
      dateRange = {
        $gte: start,
        $lte: end
      };
    } else if (period) {
      // Predefined period
      const days = parseInt(period.replace('d', '')) || 30;
      const periodStartDate = new Date();
      periodStartDate.setDate(periodStartDate.getDate() - days);
      periodStartDate.setHours(0, 0, 0, 0); // Start of day
      
      const periodEndDate = new Date();
      periodEndDate.setHours(23, 59, 59, 999); // End of today
      
      dateRange = {
        $gte: periodStartDate,
        $lte: periodEndDate
      };
    }

    // Build match conditions for sales
    const salesMatch: any = { type: 'sale' };
    if (dateRange) {
      salesMatch.createdAt = dateRange;
    }

    // Build match conditions for purchases (purchases use purchaseDate field)
    const purchaseMatch: any = {};
    if (dateRange) {
      purchaseMatch.purchaseDate = dateRange;
    }

    // Build match conditions for returns (returns use returnDate field)
    const returnsMatch: any = { status: 'approved' };
    if (dateRange) {
      returnsMatch.returnDate = dateRange;
    }

    const [
      totalProducts,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
      salesData,
      purchaseData,
      salesReturnsData,
      purchaseReturnsData,
      soldItemsData
    ] = await Promise.all([
      this.productModel.countDocuments(),
      this.productModel.aggregate([
        { $group: { _id: null, total: { $sum: { $multiply: ['$stock', '$costPrice'] } } } }
      ]),
      this.productModel.countDocuments({ $expr: { $lte: ['$stock', '$minStock'] } }),
      this.productModel.countDocuments({ stock: 0 }),
      this.orderModel.aggregate([
        { $match: salesMatch },
        { $group: { _id: null, total: { $sum: '$finalTotal' } } }
      ]),
      this.purchaseModel.aggregate([
        { $match: purchaseMatch },
        { $group: { _id: null, total: { $sum: '$totalCost' } } }
      ]),
      this.salesReturnModel.aggregate([
        { $match: returnsMatch },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      this.purchaseReturnModel.aggregate([
        { $match: returnsMatch },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // Calculate gross profit: sum of (revenue - COGS) for sold items
      // Revenue = subtotal of sold items, COGS = quantity × costPrice
      this.orderModel.aggregate([
        { $match: salesMatch },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$items.subtotal' },
            totalCOGS: { $sum: { $multiply: ['$items.quantity', '$product.costPrice'] } }
          }
        }
      ])
    ]);

    const totalSales = salesData[0]?.total || 0;
    const totalPurchases = purchaseData[0]?.total || 0;
    const totalSalesReturns = salesReturnsData[0]?.total || 0;
    const totalPurchaseReturns = purchaseReturnsData[0]?.total || 0;
    
    // Calculate revenue and gross profit from sold items
    // Note: Total Revenue = sum of item subtotals (before tax/discount)
    //       Total Sales = sum of order finalTotals (after tax/discount)
    // Currently they should be the same since tax=0 and discount=0
    const totalRevenue = soldItemsData[0]?.totalRevenue || totalSales; // Fallback to totalSales if aggregation returns empty
    const totalCOGS = soldItemsData[0]?.totalCOGS || 0;
    const grossProfit = totalRevenue - totalCOGS;

    return {
      totalProducts,
      totalStockValue: totalStockValue[0]?.total || 0,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      totalSales,
      totalRevenue,
      totalPurchases,
      totalSalesReturns,
      totalPurchaseReturns,
      grossProfit,
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
