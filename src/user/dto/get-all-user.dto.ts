import { ApiModelPropertyOptional } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { IsOptional, IsString } from 'class-validator';
import { UserSortOrder } from 'src/shared/type/user';
import { PaginationDto } from '../../shared/dto/pagination.dto';

export class GetAllUserDto extends PaginationDto {
  @ApiModelPropertyOptional()
  @IsOptional()
  sort: Partial<UserSortOrder>;
  @ApiModelPropertyOptional()
  @IsString()
  @IsOptional()
  search: string;
  @ApiModelPropertyOptional()
  @IsOptional()
  role: string;
}
