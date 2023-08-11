import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { IsNotEmpty, IsString } from 'class-validator';

export class OtpLoginDto {
  @ApiModelProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  username: string;
}
