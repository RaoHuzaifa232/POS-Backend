import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';

@ApiTags('stock-movements')
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new stock movement' })
  create(@Body() createStockMovementDto: CreateStockMovementDto) {
    return this.stockMovementsService.create(createStockMovementDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stock movements' })
  findAll() {
    return this.stockMovementsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a stock movement by id' })
  findOne(@Param('id') id: string) {
    return this.stockMovementsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a stock movement' })
  update(@Param('id') id: string, @Body() updateStockMovementDto: UpdateStockMovementDto) {
    return this.stockMovementsService.update(id, updateStockMovementDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock movement' })
  remove(@Param('id') id: string) {
    return this.stockMovementsService.remove(id);
  }
}
