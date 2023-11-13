import { Expose, Transform } from 'class-transformer';
import { CompressedImage } from '../schema/file.schema';
import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';

export class FileDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string;

  @Expose()
  originalName: string;

  @Expose()
  name: string;

  @Expose()
  path: string;

  @Expose()
  type: string;

  @Expose()
  compressImages: CompressedImage[];
}

export class DeleteFileDto {
  @ApiModelProperty()
  fileIds: Array<string>;
}
