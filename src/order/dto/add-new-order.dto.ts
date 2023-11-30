import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { IsArray, IsObject } from 'class-validator';
import { OrderProduct } from 'src/order/schema/order-product.schema';
import { ORDER_STATUS } from 'src/shared/utils/constant/order';

export class AddNewOrderDto {
  @ApiModelProperty({
    required: true,
  })
  @IsArray()
  @IsObject({ each: true })
  items: OrderProduct[];

  @ApiModelProperty({
    required: true,
    default: ORDER_STATUS.CONFIRMED,
  })
  status: string;

  @ApiModelProperty({
    required: true,
  })
  totalPrice: number;

  @ApiModelProperty({
    required: true,
  })
  totalWeight: number;

  @ApiModelProperty({
    required: true,
  })
  addressId: string;
  @ApiPropertyOptional()
  userId: string;
  @ApiPropertyOptional()
  fullName: string;
  @ApiPropertyOptional()
  phone: string;

  @ApiPropertyOptional()
  note: string;
}
