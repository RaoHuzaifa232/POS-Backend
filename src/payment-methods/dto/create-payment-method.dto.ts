import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreatePaymentMethodDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['cash', 'bank', 'digital'] })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  isActive: boolean;
}
