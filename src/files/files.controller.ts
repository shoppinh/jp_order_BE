import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiHeader,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import * as moment from 'moment-timezone';
import { Types } from 'mongoose';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/shared/decorator/roles.decorator';
import { Serialize } from 'src/shared/interceptor/serialize.interceptor';
import { ApiException } from 'src/shared/type/api-exception.model';
import { ConstantRoles } from 'src/shared/utils/constant/role';
import { User } from 'src/user/schema/user.schema';
import { FilesService } from './files.service';
import { DeleteFileDto, FileDto } from './dto/file.dto';
import { GetUser } from 'src/shared/decorator/current-user.decorator';
import { FileType } from './enum/file-type.enum';
import { ApiResponse } from 'src/shared/response/api.response';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiTags('Files')
@ApiHeader({ name: 'locale', description: 'en' })
@ApiHeader({ name: 'version', description: '1' })
@Controller('api/files')
@UseGuards(JwtGuard, RolesGuard)
export class FilesController {
  constructor(private readonly _filesService: FilesService) {}

  @Post('upload/image')
  @ApiBearerAuth()
  @Roles(ConstantRoles.STORAGE_MANAGER, ConstantRoles.SUPER_USER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBadRequestResponse({ type: ApiException })
  @ApiOperation({
    summary: 'Upload an image',
  })
  @Serialize(FileDto)
  async uploadImageFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
    @GetUser() currentUser: User,
  ) {
    const { originalFileName, fileName, filePath, compressImages } =
      await this._filesService.handleFile(file, FileType.IMAGE_FILE);
    const expiredDate = moment().tz(process.env.TZ).endOf('day').toDate();
    const result = await this._filesService.create({
      createdBy: new Types.ObjectId(currentUser._id),
      originalName: originalFileName,
      name: fileName,
      path: filePath,
      expiredDate,
      type: FileType.IMAGE_FILE,
      compressImages,
    });
    return new ApiResponse(result);
  }

  @Post('upload/images')
  @ApiBearerAuth()
  @Roles(ConstantRoles.STORAGE_MANAGER, ConstantRoles.SUPER_USER)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBadRequestResponse({ type: ApiException })
  @ApiOperation({
    summary: 'Upload multiple images',
    description: 'Maximum files is 5',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  uploadImages(
    @GetUser() user,
    @UploadedFiles()
    files: Express.Multer.File[],
    @I18n() i18n: I18nContext,
  ) {
    return this._filesService.uploadMultipleFiles(user._id, files, i18n, {
      maxItems: 5,
      types: ['jpg', 'jpeg', 'png'],
      maxSize: 10 * 1024 * 1024,
    });
  }

  @Delete('')
  @ApiBadRequestResponse({ type: ApiException })
  @ApiOperation({
    summary: 'Delete given file',
  })
  async deleteGivenFile(
    @Body() deleteFileDto: DeleteFileDto,
    i18n: I18nContext,
    @GetUser() currentUser: User,
  ) {
    const { fileIds } = deleteFileDto;
    const files = await this._filesService.findAll({
      _id: { $in: fileIds.map((fileId) => new Types.ObjectId(fileId)) },
    });
    for (const file of files) {
      this._filesService.deleteFile(file.path).then();
      if (file?.compressImages?.length) {
        for (const ci of file.compressImages) {
          this._filesService.deleteFile(ci.path).then();
        }
      }
    }
    const result = await this._filesService.deleteRecordsByGivenCondition({
      _id: { $in: fileIds.map((fileId) => new Types.ObjectId(fileId)) },
    });
    return new ApiResponse(result);
  }
}
