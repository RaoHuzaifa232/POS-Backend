import { Controller, Get, Post, Body, Put, Param, Delete, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { SalesReturnsService } from './sales-returns.service';
import { CreateSalesReturnDto } from './dto/create-sales-return.dto';
import { UpdateSalesReturnDto } from './dto/update-sales-return.dto';

@ApiTags('sales-returns')
@Controller('sales-returns')
export class SalesReturnsController {
  constructor(private readonly salesReturnsService: SalesReturnsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sales return' })
  create(@Body() createSalesReturnDto: CreateSalesReturnDto) {
    return this.salesReturnsService.create(createSalesReturnDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales returns' })
  findAll() {
    return this.salesReturnsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sales return by id' })
  findOne(@Param('id') id: string) {
    return this.salesReturnsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sales return' })
  update(@Param('id') id: string, @Body() updateSalesReturnDto: UpdateSalesReturnDto) {
    return this.salesReturnsService.update(id, updateSalesReturnDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update sales return status' })
  @ApiBody({ schema: { properties: { status: { type: 'string', enum: ['pending', 'approved', 'rejected'] } } } })
  updateStatus(@Param('id') id: string, @Body('status') status: 'pending' | 'approved' | 'rejected') {
    return this.salesReturnsService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sales return' })
  remove(@Param('id') id: string) {
    return this.salesReturnsService.remove(id);
  }
}
