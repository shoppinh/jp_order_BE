import { ApiModelPropertyOptional } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { IsOptional, IsString } from 'class-validator';
import { SortOrder } from 'mongoose';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SortOrderDto } from 'src/shared/dto/sort-order.dto';

export class GetAllProductDto extends PaginationDto {
  @ApiModelPropertyOptional()
  @IsOptional()
  sort;
  @ApiModelPropertyOptional()
  @IsString()
  @IsOptional()
  search: string;
}

export class ProductSortOrder extends SortOrderDto {
  @ApiModelPropertyOptional({ default: 1, description: 'ASC or 1, DESC or -1' })
  name: SortOrder;
  @ApiModelPropertyOptional({ default: 1, description: 'ASC or 1, DESC or -1' })
  price: SortOrder;
}
