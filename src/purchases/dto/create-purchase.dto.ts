import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { DefaultString } from '../../common/decorators/default-value.decorator';

export class CreatePurchaseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  costPrice: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalCost: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  supplier: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @DefaultString('')
  invoiceNumber?: string;

  @ApiProperty()
  @IsNotEmpty()
  purchaseDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @DefaultString('')
  notes?: string;
}
