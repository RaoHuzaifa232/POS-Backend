import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { DefaultString } from '../../common/decorators/default-value.decorator';

export class CreateSupplierDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  contact: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @DefaultString('')
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @DefaultString('')
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @DefaultString('')
  phone?: string;
}
