import { Module } from '@nestjs/common';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Setting, SettingSchema } from './schema/setting.schema';

@Module({
  controllers: [SettingController],
  providers: [SettingService],
  exports: [SettingService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Setting.name,
        schema: SettingSchema,
      },
    ]),
  ],
})
export class SettingModule {}
