import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddNewAddressDto {
  @ApiModelProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  street1: string;
}
