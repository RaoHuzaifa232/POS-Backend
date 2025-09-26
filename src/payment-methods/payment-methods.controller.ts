import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@ApiTags('payment-methods')
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment method' })
  create(@Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create(createPaymentMethodDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payment methods' })
  findAll() {
    return this.paymentMethodsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active payment methods' })
  findActive() {
    return this.paymentMethodsService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment method by id' })
  findOne(@Param('id') id: string) {
    return this.paymentMethodsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a payment method' })
  update(@Param('id') id: string, @Body() updatePaymentMethodDto: UpdatePaymentMethodDto) {
    return this.paymentMethodsService.update(id, updatePaymentMethodDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment method' })
  remove(@Param('id') id: string) {
    return this.paymentMethodsService.remove(id);
  }
}
