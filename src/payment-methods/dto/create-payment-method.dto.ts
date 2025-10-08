import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { DefaultString, DefaultBoolean } from '../../common/decorators/default-value.decorator';

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
  @DefaultString('')
  accountNumber?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @DefaultBoolean(true)
  isActive: boolean;
}
