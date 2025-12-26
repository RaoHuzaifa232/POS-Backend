import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('inventory-report')
  @ApiOperation({ summary: 'Get inventory report' })
  @ApiQuery({ name: 'period', required: false, description: 'Period in days (e.g., 30d)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  getInventoryReport(
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getInventoryReport(period, startDate, endDate);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock products' })
  getLowStockProducts() {
    return this.dashboardService.getLowStockProducts();
  }

  @Get('out-of-stock')
  @ApiOperation({ summary: 'Get out of stock products' })
  getOutOfStockProducts() {
    return this.dashboardService.getOutOfStockProducts();
  }

  @Get('sales-summary')
  @ApiOperation({ summary: 'Get sales summary' })
  @ApiQuery({ name: 'period', required: false, description: 'Period in days (e.g., 30d)' })
  getSalesSummary(@Query('period') period?: string) {
    return this.dashboardService.getSalesSummary(period);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of products to return' })
  getTopProducts(@Query('limit') limit?: number) {
    return this.dashboardService.getTopProducts(limit);
  }
}
