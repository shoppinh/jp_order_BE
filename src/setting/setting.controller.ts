import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetUser } from 'src/shared/decorator/current-user.decorator';
import { ApiResponse } from 'src/shared/response/api.response';
import { ApiException } from 'src/shared/type/api-exception.model';
import { User } from 'src/user/schema/user.schema';
import { SettingService } from './setting.service';

@Controller('api/setting')
@ApiTags('Setting')
@ApiHeader({ name: 'locale', description: 'en' })
@ApiHeader({ name: 'version', description: '1' })
@UseGuards(JwtGuard)
export class SettingController {
  constructor(private readonly _settingService: SettingService) {}

  @Get('')
  @ApiBearerAuth()
  @ApiBadGatewayResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getSetting(@GetUser() user: User, @I18n() i18n: I18nContext) {
    try {
      const existedSetting = await this._settingService.findOne({
        appId: process.env.APP_ID,
      });
      if (!existedSetting) {
        throw new HttpException(
          await i18n.translate(`common.not_found`, {
            args: { fieldName: 'setting' },
          }),
          HttpStatus.BAD_REQUEST,
        );
      }
      return new ApiResponse(existedSetting);
    } catch (error) {
      throw new HttpException(
        error?.response ??
          (await i18n.translate(`message.internal_server_error`)),
        error?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }
}
