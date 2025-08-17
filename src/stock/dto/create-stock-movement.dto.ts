import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';

export class CreateStockMovementDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ enum: ['IN', 'OUT'] })
  @IsEnum(['IN', 'OUT'])
  type: 'IN' | 'OUT';

  @ApiProperty({ required: false })
  @IsString()
  reference?: string;
}
