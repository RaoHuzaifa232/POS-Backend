import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';

export class CreateStockMovementDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productName: string;

  @ApiProperty({ enum: ['IN', 'OUT', 'ADJUSTMENT'] })
  @IsEnum(['IN', 'OUT', 'ADJUSTMENT'])
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({ required: false })
  @IsString()
  reference?: string;

  @ApiProperty({ required: false })
  timestamp?: Date;
}
