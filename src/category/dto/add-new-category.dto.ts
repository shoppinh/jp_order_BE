import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddNewCategoryDto {
  @ApiModelProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  name: string;
  @ApiModelProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
