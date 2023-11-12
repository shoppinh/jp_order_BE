import {
  ApiModelProperty,
  ApiModelPropertyOptional,
} from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class AddNewProductDto {
  @ApiModelProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiModelProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiModelPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiModelPropertyOptional()
  @IsArray({
    always: false,
  })
  @IsString({ each: true })
  @IsOptional()
  imageAttachments?: string[];

  @ApiModelPropertyOptional()
  @IsString()
  @IsOptional()
  SKU?: string;

  @ApiModelProperty({
    required: true,
    default: 0,
  })
  @IsNumber()
  quantity: number;

  @ApiModelProperty({
    required: true,
    default: 0,
  })
  @IsNumber()
  price: number;
  @ApiModelPropertyOptional()
  @IsNumber()
  @IsOptional()
  salePrice: number;

  @ApiModelPropertyOptional()
  @IsString()
  @IsOptional()
  productSrcURL?: string;
}
