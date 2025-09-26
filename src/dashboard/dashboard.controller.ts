import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get comprehensive dashboard statistics' })
  getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('products/by-category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiQuery({ name: 'categoryId', required: false })
  getProductsByCategory(@Query('categoryId') categoryId?: string) {
    return this.dashboardService.getProductsByCategory(categoryId);
  }

  @Get('products/by-supplier')
  @ApiOperation({ summary: 'Get products by supplier' })
  @ApiQuery({ name: 'supplierId', required: false })
  getProductsBySupplier(@Query('supplierId') supplierId?: string) {
    return this.dashboardService.getProductsBySupplier(supplierId);
  }

  @Get('purchases/by-supplier')
  @ApiOperation({ summary: 'Get purchases by supplier' })
  @ApiQuery({ name: 'supplierId', required: false })
  getPurchasesBySupplier(@Query('supplierId') supplierId?: string) {
    return this.dashboardService.getPurchasesBySupplier(supplierId);
  }

  @Get('stock-movements/by-product')
  @ApiOperation({ summary: 'Get stock movements by product' })
  @ApiQuery({ name: 'productId', required: true })
  getStockMovementsByProduct(@Query('productId') productId: string) {
    return this.dashboardService.getStockMovementsByProduct(productId);
  }
}