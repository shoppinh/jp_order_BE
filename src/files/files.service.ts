import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as moment from 'moment-timezone';
import { Model, Types } from 'mongoose';
import { uid } from 'rand-token';
import * as sharp from 'sharp';

import { I18nContext } from 'nestjs-i18n';
import { FileType, Folder, ImageQuality } from './enum/';
import { Files, FilesDocument } from './schema/file.schema';
import { BaseService } from 'src/shared/service/base.service';
import { ValidateFilesOptions } from 'src/shared/type';

@Injectable()
export class FilesService extends BaseService<Files> {
  constructor(
    @InjectModel(Files.name) private readonly _model: Model<FilesDocument>,
  ) {
    super();
    this.model = _model;
  }

  async handleFile(file: Express.Multer.File, fileType: FileType) {
    let folderName = Folder.FILES;
    switch (fileType) {
      case FileType.IMAGE_FILE:
        folderName = Folder.IMAGES;
    }
    const fileExt = file.originalname.split('.').pop();
    const { fileName, filePath } = await this._generatePhysicalFile(
      fileExt,
      folderName,
      file.buffer,
    );
    let compressImages = [];
    if (fileType === FileType.IMAGE_FILE) {
      compressImages = await this._compressImages(file.buffer, fileExt);
    }

    return {
      originalFileName: file.originalname,
      fileName,
      filePath,
      compressImages,
    };
  }

  async generateFileFromBase64(
    base64: string,
    name: string,
    fileExt: string,
    fileType: FileType,
  ) {
    let folderName = Folder.FILES;
    switch (fileType) {
      case FileType.IMAGE_FILE:
        folderName = Folder.IMAGES;
    }
    const currentTimestamp = +new Date();
    const newFileName = `${currentTimestamp}_${uid(15)}.${fileExt}`;
    await this.createFolder(folderName);
    fs.writeFileSync(`./public/${folderName}/${newFileName}`, base64, 'base64');
    return {
      originalFileName: name,
      fileName: newFileName,
      filePath: `${folderName}/${newFileName}`,
    };
  }

  /**
   * For cron job - remove expired files
   */
  async deleteExpiredFiles(): Promise<void> {
    const currentISODate = new Date().toISOString();
    const expiredFiles = await this._model
      .find({ expiredDate: { $lte: currentISODate } })
      .exec();
    for (const file of expiredFiles) {
      await this.deleteFile(file.path);
      await this.deleteMultipleFiles(
        file?.compressImages?.map((ci) => ci.path),
      );
    }
    await this._model.deleteMany({ expiredDate: { $lte: currentISODate } });
  }

  async removeExpiredDate(imageIds: string[]) {
    return this._model
      .updateMany(
        { _id: { $in: imageIds.map((imgId) => new Types.ObjectId(imgId)) } },
        {
          expiredDate: null,
          updatedAt: new Date(),
        },
      )
      .exec();
  }

  async deleteRecordsByGivenCondition(filter: object) {
    return this._model.deleteMany(filter).exec();
  }

  /**
   * Delete physical file
   * @param filePath
   */
  async deleteFile(filePath: string) {
    try {
      return fs.rmSync(`./${Folder.PUBLIC}/${filePath}`);
    } catch (e) {
      return false;
    }
  }

  /**
   * Delete multiple physical files
   * @param filePaths
   */
  async deleteMultipleFiles(filePaths: string[]) {
    if (filePaths?.length) {
      for (const filePath of filePaths) {
        await this.deleteFile(filePath);
      }
    }
  }

  async uploadMultipleFiles(
    userId: string,
    files: Express.Multer.File[],
    i18n: I18nContext,
    options?: ValidateFilesOptions,
  ) {
    this.validateFiles(files, i18n, options);

    const executedFiles = await Promise.all(
      files.map((file) => this.handleFile(file, FileType.IMAGE_FILE)),
    );
    const expiredDate = moment().tz(process.env.TZ).endOf('day').toDate();
    return this._model.insertMany(
      executedFiles.map((file) => ({
        createdBy: new Types.ObjectId(userId),
        originalName: file.originalFileName,
        name: file.fileName,
        path: file.filePath,
        expiredDate,
        type: FileType.IMAGE_FILE,
        compressImages: file.compressImages,
      })),
    );
  }

  private validateFiles(
    files: Express.Multer.File[],
    i18n: I18nContext,
    options?: ValidateFilesOptions,
  ) {
    const { maxItems, types, maxSize } = options;

    // check max items
    if (maxItems && files.length > maxItems) {
      throw new BadRequestException(
        i18n.t('file.over_max_length', { args: { maxItems } }),
      );
    }

    // check file type
    const fileTypeReg = new RegExp(`(${types.join('|')})$`);
    if (
      types?.length &&
      !files.every((file) => fileTypeReg.test(file.mimetype))
    ) {
      throw new BadRequestException(
        i18n.t('file.invalid_type', { args: { types: types.join(', ') } }),
      );
    }

    // check max size
    if (maxSize && files.some((file) => file.size > maxSize)) {
      throw new BadRequestException(
        i18n.t('file.over_max_file_size', { args: { maxSize, unit: 'MB' } }),
      );
    }
  }

  private async _compressImages(fileBuffer: Buffer, fileExt: string) {
    const compressImages = [];
    const { fileName, absoluteFilePath, filePath } =
      await this._generateFilePath(fileExt, Folder.IMAGES);
    await sharp(fileBuffer)
      .png({
        quality: ImageQuality.LOW,
        force: false,
      })
      .jpeg({
        quality: ImageQuality.LOW,
        force: false,
      })
      .toFile(`${absoluteFilePath}`);
    compressImages.push({
      quality: ImageQuality.LOW,
      name: fileName,
      path: filePath,
    });
    return compressImages;
  }

  private _generateFileName(fileExt: string) {
    const currentTimestamp = +new Date();
    return `${currentTimestamp}_${uid(15)}.${fileExt}`;
  }

  async createFolder(folderName: string) {
    const folderPath = `./${Folder.PUBLIC}/${folderName}`;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    return folderPath;
  }

  private async _generateFilePath(fileExt: string, folderName: string) {
    const fileName = this._generateFileName(fileExt);
    const folderPath = await this.createFolder(folderName);
    const filePath = `${folderName}/${fileName}`;
    const absoluteFilePath = `${folderPath}/${fileName}`;
    return {
      fileName,
      filePath,
      absoluteFilePath,
    };
  }

  private async _generatePhysicalFile(
    fileExt: string,
    folderName: string,
    fileBuffer: Buffer,
  ) {
    const { fileName, filePath, absoluteFilePath } =
      await this._generateFilePath(fileExt, folderName);
    fs.writeFileSync(`${absoluteFilePath}`, fileBuffer);
    return {
      fileName,
      filePath,
    };
  }
}
