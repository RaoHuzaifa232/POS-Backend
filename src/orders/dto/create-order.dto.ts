import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
  discount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  finalTotal: number;

  @ApiProperty({ enum: ['cash', 'card', 'digital'] })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ required: false })
  @IsString()
  customerName?: string;

  @ApiProperty({ enum: ['sale', 'purchase'] })
  @IsString()
  type: string;
}
