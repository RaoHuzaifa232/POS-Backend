import {
  Controller,
  Get,
  Post,
  Body,
//   Put,
  Param,
//   Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
// import { UpdateSupplierDto } from './dto/update-supplier.dto';

@ApiTags('suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new supplier' })
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all suppliers' })
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier by id' })
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

//   @Put(':id')
//   @ApiOperation({ summary: 'Update a supplier' })
//   update(
//     @Param('id') id: string,
//     @Body() updateSupplierDto: UpdateSupplierDto,
//   ) {
//     return this.suppliersService.update(id, updateSupplierDto);
//   }

//   @Delete(':id')
//   @ApiOperation({ summary: 'Delete a supplier' })
//   remove(@Param('id') id: string) {
//     return this.suppliersService.remove(id);
//   }
}
