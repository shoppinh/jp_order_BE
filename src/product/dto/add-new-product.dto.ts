import {
  ApiModelProperty,
  ApiModelPropertyOptional,
} from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

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
  @ApiModelPropertyOptional({
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  description?: string;
  @ApiModelPropertyOptional({
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  imageAttachments?: string[];
  @ApiModelProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  SKU: string;
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
}
