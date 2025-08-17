import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { CreateLegacyStockMovementDto } from './dto/create-stock-movement.dto';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('movement')
  @ApiOperation({ summary: 'Record a stock movement' })
  createMovement(@Body() createStockMovementDto: CreateLegacyStockMovementDto) {
    return this.stockService.recordMovement(
      createStockMovementDto.productId,
      createStockMovementDto.quantity,
      createStockMovementDto.type,
      createStockMovementDto.reference,
    );
  }

  @Get('movements/:productId')
  @ApiOperation({ summary: 'Get stock movements for a product' })
  getMovements(@Param('productId') productId: string) {
    return this.stockService.getMovements(productId);
  }

  @Get('current/:productId')
  @ApiOperation({ summary: 'Get current stock level for a product' })
  getCurrentStock(@Param('productId') productId: string) {
    return this.stockService.getCurrentStock(productId);
  }
}
