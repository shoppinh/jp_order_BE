import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiModelProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiModelProperty({ required: false })
  @IsOptional()
  password: boolean;

  @ApiModelProperty({ required: false })
  @IsOptional()
  retypedPassword: boolean;
}
