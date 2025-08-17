import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PurchaseReturnsService } from './purchase-returns.service';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
import { UpdatePurchaseReturnDto } from './dto/update-purchase-return.dto';

@ApiTags('purchase-returns')
@Controller('purchase-returns')
export class PurchaseReturnsController {
  constructor(private readonly purchaseReturnsService: PurchaseReturnsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new purchase return' })
  create(@Body() createPurchaseReturnDto: CreatePurchaseReturnDto) {
    return this.purchaseReturnsService.create(createPurchaseReturnDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all purchase returns' })
  findAll() {
    return this.purchaseReturnsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a purchase return by id' })
  findOne(@Param('id') id: string) {
    return this.purchaseReturnsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a purchase return' })
  update(@Param('id') id: string, @Body() updatePurchaseReturnDto: UpdatePurchaseReturnDto) {
    return this.purchaseReturnsService.update(id, updatePurchaseReturnDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a purchase return' })
  remove(@Param('id') id: string) {
    return this.purchaseReturnsService.remove(id);
  }
}
