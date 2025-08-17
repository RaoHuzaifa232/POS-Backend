import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsArray } from 'class-validator';

export class OrderItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  price: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  orderNumber: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  items: OrderItemDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;
}
