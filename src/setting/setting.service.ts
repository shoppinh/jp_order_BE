import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/shared/service/base.service';
import { Setting, SettingDocument } from './schema/setting.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SettingService extends BaseService<Setting> {
  constructor(
    @InjectModel(Setting.name) readonly modelSetting: Model<SettingDocument>,
  ) {
    super();
    this.model = modelSetting;
  }
}
