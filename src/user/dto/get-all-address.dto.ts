import { ApiModelPropertyOptional } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { SortOrder } from 'mongoose';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SortOrderDto } from 'src/shared/dto/sort-order.dto';

export class GetAllAddressDto extends PaginationDto {
  @ApiModelPropertyOptional()
  sort?: Partial<AddressSortOrder>;
  @ApiModelPropertyOptional()
  search?: string;
}

export class AddressSortOrder extends SortOrderDto {
  @ApiModelPropertyOptional({ default: 1, description: 'ASC or 1, DESC or -1' })
  address?: SortOrder;
  @ApiModelPropertyOptional({ default: 1, description: 'ASC or 1, DESC or -1' })
  ward?: SortOrder;
  @ApiModelPropertyOptional({ default: 1, description: 'ASC or 1, DESC or -1' })
  wardId?: SortOrder;
  @ApiModelPropertyOptional({ default: 1, description: 'ASC or 1, DESC or -1' })
  district?: SortOrder;
  @ApiModelPropertyOptional({ default: 1, description: 'ASC or 1, DESC or -1' })
  districtId?: SortOrder;
  @ApiModelPropertyOptional({ default: 1, description: 'ASC or 1, DESC or -1' })
  province?: SortOrder;
  @ApiModelPropertyOptional({ default: 1, description: 'ASC or 1, DESC or -1' })
  provinceId?: SortOrder;
  @ApiModelPropertyOptional({ default: 1, description: 'ASC or 1, DESC or -1' })
  city?: SortOrder;
  @ApiModelPropertyOptional({ default: 1, description: 'ASC or 1, DESC or -1' })
  country?: SortOrder;
}
