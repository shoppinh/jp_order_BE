import { ApiModelPropertyOptional } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { IsOptional, IsString } from 'class-validator';
import { SortOrder } from 'mongoose';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SortOrderDto } from 'src/shared/dto/sort-order.dto';

export class GetAllCategoryDto extends PaginationDto {
  @ApiModelPropertyOptional()
  @IsOptional()
  sort: Partial<CategorySortOrder>;
  @ApiModelPropertyOptional()
  @IsString()
  @IsOptional()
  search: string;
}

export class CategorySortOrder extends SortOrderDto {
  @ApiModelPropertyOptional({ default: 1, description: 'ASC or 1, DESC or -1' })
  name?: SortOrder;
}
