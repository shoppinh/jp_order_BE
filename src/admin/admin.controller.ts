import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Roles } from 'src/shared/decorator/roles.decorator';
import { ApiException } from 'src/shared/type/api-exception.model';
import {
  validateFields,
  convertKeyRoles,
  isEmptyObjectOrArray,
} from 'src/shared/utils';
import { ConstantRoles } from 'src/shared/utils/constant/role';
import { AddRoleDto } from 'src/user/dto/add-role.dto';
import { RoleService } from 'src/user/service/role.service';
import { ApiResponse } from '../shared/response/api.response';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';

@Controller('api/admin')
@ApiTags('Admin')
@ApiHeader({ name: 'locale', description: 'en' })
@ApiHeader({ name: 'version', description: '1' })
@UseGuards(JwtGuard, RolesGuard)
export class AdminController {
  constructor(private readonly _roleService: RoleService) {}

  @Post('add-roles')
  @ApiBearerAuth()
  @Roles(ConstantRoles.SUPER_USER)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async addRoles(@Body() roles: AddRoleDto[], @I18n() i18n: I18nContext) {
    try {
      await validateFields({ roles }, `common.required_field`, i18n);
      const getInputRoles = roles.map((el) => convertKeyRoles(el.roleKey));
      const findAllRoles = await this._roleService.findAll({
        roleKey: { $in: getInputRoles },
      });
      let roleItemToCreate = [];
      const rolesResult = [];
      if (!isEmptyObjectOrArray(findAllRoles)) {
        roleItemToCreate = findAllRoles.map((el) => el.roleKey);
        for (const role of findAllRoles) {
          const findRole = roles.find(
            (el) => convertKeyRoles(el.roleKey) === role.roleKey,
          );
          if (!isEmptyObjectOrArray(findRole)) {
            role.isActive = findRole?.isActive;
            role.roleKey = convertKeyRoles(findRole.roleKey);
            role.roleName = findRole.roleName;
            rolesResult.push(await this._roleService.update(role._id, role));
          }
        }
      }

      if (!isEmptyObjectOrArray(roles)) {
        const rolesArray = roles.filter(
          (el) => !roleItemToCreate.includes(convertKeyRoles(el.roleKey)),
        );
        if (!isEmptyObjectOrArray(rolesArray)) {
          for (const role of rolesArray) {
            const item = {
              isActive: role.isActive,
              roleKey: convertKeyRoles(role.roleKey),
              roleName: role.roleName,
            };
            rolesResult.push(await this._roleService.create(item));
          }
        }
      }
      return new ApiResponse({
        success: true,
        rolesResult,
      });
    } catch (error) {
      console.log(
        '🚀 ~ file: admin.controller.ts:30 ~ addRoles ~ error',
        error,
      );
      throw new HttpException(
        error?.response ??
          (await i18n.translate('message.internal_server_error')),
        error?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }
}
