import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { DefaultNumber, DefaultString } from '../../common/decorators/default-value.decorator';

export class CartItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  product: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  subtotal: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  total: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  tax: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @DefaultNumber(0)
  discount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  finalTotal: number;

  @ApiProperty({ enum: ['cash', 'card', 'digital'] })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @DefaultString('')
  customerName?: string;

  @ApiProperty({ enum: ['sale', 'purchase'] })
  @IsString()
  type: string;
}
