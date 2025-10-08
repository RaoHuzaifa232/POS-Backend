import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { DefaultNumber, DefaultString } from '../../common/decorators/default-value.decorator';

export class CreateProductDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  costPrice: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @DefaultString('')
  image?: string;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  @DefaultNumber(0)
  stock: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  @DefaultNumber(0)
  minStock: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @DefaultString('')
  barcode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @DefaultString('')
  supplier?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @DefaultString('')
  description?: string;
}
