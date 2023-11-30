import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

export class QueryProductDto {
  @ApiModelProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  productSrcURL: string;
}
