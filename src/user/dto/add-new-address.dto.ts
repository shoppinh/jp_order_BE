import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AddNewAddressDto {
  @ApiModelProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  address: string;
  @ApiModelProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  ward: string;
  @ApiModelProperty({ required: true })
  @IsNumber()
  @IsNotEmpty()
  wardId: number;
  @ApiModelProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  district: string;
  @ApiModelProperty({ required: true })
  @IsNumber()
  @IsNotEmpty()
  districtId: number;

  @ApiModelProperty({ required: true })
  @IsNumber()
  @IsNotEmpty()
  provinceId: number;
  @ApiModelProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiModelProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiModelProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  zip: string;
}
