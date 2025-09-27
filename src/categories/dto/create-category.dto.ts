import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { DefaultString } from '../../common/decorators/default-value.decorator';

export class CreateCategoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  color: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @DefaultString('')
  description?: string;
}
