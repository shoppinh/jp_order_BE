import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Roles } from 'src/shared/decorator/roles.decorator';
import { ApiException } from 'src/shared/type/api-exception.model';
import {
  toListResponse,
  validateFields,
  isPhoneNumberValidation,
  isValidEmail,
  passwordGenerate,
} from 'src/shared/utils';
import { ConstantRoles } from 'src/shared/utils/constant/role';
import { AddUserDto } from './dto/add-user.dto';
import { ApiResponse } from '../shared/response/api.response';
import { UserService } from './service/user.service';
import { GetAllUserDto } from './dto/get-all-user.dto';
import { RoleService } from './service/role.service';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { GetUser } from 'src/shared/decorator/current-user.decorator';
import { User } from './schema/user.schema';
import { GetAllAddressDto } from './dto/get-all-address.dto';
import { AddressService } from './service/address.service';
import { AddNewAddressDto } from './dto/add-new-address.dto';

@Controller('api/user')
@ApiTags('User')
@ApiHeader({ name: 'locale', description: 'en' })
@ApiHeader({ name: 'version', description: '1' })
@UseGuards(JwtGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly _userService: UserService,
    private readonly _roleService: RoleService,
    private readonly _addressService: AddressService,
  ) {}

  // User controller collection

  @Post('list')
  @ApiBearerAuth()
  @Roles(ConstantRoles.SUPER_USER)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getAllUser(
    @Body() getAllUserDto: GetAllUserDto,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { skip, limit, sort, search } = getAllUserDto;

      const result = await this._userService.getUserList(
        sort,
        search,
        limit,
        skip,
      );
      const [{ totalRecords, data }] = result;
      return new ApiResponse({
        ...toListResponse([data, totalRecords?.[0]?.total ?? 0]),
      });
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

  @Get(':id')
  @ApiBearerAuth()
  @Roles(ConstantRoles.SUPER_USER)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getUserDetail(@Param('id') id: string, @I18n() i18n: I18nContext) {
    try {
      await validateFields({ id }, `common.required_field`, i18n);
      //Check if user exists
      const user = await this._userService.findById(id);
      if (!user) {
        throw new HttpException(
          await i18n.translate(`common.not_found`, {
            args: { fieldName: 'user' },
          }),
          HttpStatus.BAD_REQUEST,
        );
      }

      return new ApiResponse(user);
    } catch (error) {
      console.log('error', error);
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

  @Get('profile')
  @ApiBearerAuth()
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getProfile(@GetUser() user: User, @I18n() i18n: I18nContext) {
    try {
      const result = await this._userService.findOne(
        {
          _id: new Types.ObjectId(user._id),
        },
        { password: 0 },
      );
      if (!result) {
        throw new HttpException(
          await i18n.translate(`common.not_found`, {
            args: { fieldName: 'user' },
          }),
          HttpStatus.BAD_REQUEST,
        );
      }
      return new ApiResponse(result);
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

  @Post('')
  @ApiBearerAuth()
  @Roles(ConstantRoles.SUPER_USER)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async addUser(@Body() userDto: AddUserDto, @I18n() i18n: I18nContext) {
    try {
      const user = await this._userService.addSingleUser(userDto, i18n);
      return new ApiResponse(user);
    } catch (error) {
      console.log('error', error);
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

  @Put(':id')
  @ApiBearerAuth()
  @Roles(ConstantRoles.SUPER_USER)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Body() userDto: Partial<AddUserDto>,
    @I18n() i18n: I18nContext,
    @Param('id') id: string,
  ) {
    try {
      const {
        mobilePhone,
        username,
        email,
        firstName,
        lastName,
        fullName,
        isActive,
        roleKey,
        password,
      } = userDto;
      await validateFields({ id }, `common.required_field`, i18n);

      if (mobilePhone && !isPhoneNumberValidation(mobilePhone)) {
        throw new HttpException(
          await i18n.translate(`user.phone_invalid_field`),
          HttpStatus.BAD_REQUEST,
        );
      }
      if (email && !isValidEmail(email)) {
        throw new HttpException(
          await i18n.translate(`user.email_invalid_field`),
          HttpStatus.BAD_REQUEST,
        );
      }
      //Check Email
      const userExistedEmail = await this._userService.findOne({ email });
      if (
        userExistedEmail &&
        email !== userExistedEmail.email &&
        userExistedEmail?._id
      ) {
        throw new HttpException(
          await i18n.translate('message.existed_email'),
          HttpStatus.CONFLICT,
        );
      }

      // Check phone
      const userExistedPhone = await this._userService.findOne({ mobilePhone });
      if (
        userExistedPhone &&
        mobilePhone !== userExistedPhone.mobilePhone &&
        userExistedPhone?._id
      ) {
        throw new HttpException(
          await i18n.translate('message.existed_phone_number'),
          HttpStatus.CONFLICT,
        );
      }

      //Check if role exists
      if (roleKey) {
        const getAllRole = await this._roleService.getAllRole();
        const allRoleKeyExist = getAllRole.map((el) =>
          el?.roleKey?.toString().toLocaleUpperCase(),
        );
        const isRoleKeyInAllRole = allRoleKeyExist.includes(
          roleKey.toLocaleUpperCase(),
        );
        if (!isRoleKeyInAllRole) {
          throw new HttpException(
            await i18n.translate(`common.not_found`, {
              args: { fieldName: 'roleKey' },
            }),
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      //User need to update
      const user = await this._userService.findOne({
        _id: new Types.ObjectId(id),
      });
      if (!user) {
        throw new HttpException(
          await i18n.translate(`common.not_found`, {
            args: { fieldName: 'id' },
          }),
          HttpStatus.BAD_REQUEST,
        );
      }
      const userInstance: any = {
        mobilePhone: mobilePhone?.trim(),
        username: username?.trim(),
        email: email?.trim(),
        isActive,
        firstname: firstName,
        fullname: fullName,
        lastname: lastName,
        role: roleKey,
        password: password && (await passwordGenerate(password)),
      };
      const result = await this._userService.update(id, userInstance);
      return new ApiResponse(result);
    } catch (error) {
      console.log('error', error);
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

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(ConstantRoles.SUPER_USER)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async deleteUser(@I18n() i18n: I18nContext, @Param('id') id: string) {
    try {
      await validateFields({ id }, `common.required_field`, i18n);
      const user = await this._userService.findById(id);

      if (!user) {
        throw new HttpException(
          await i18n.translate(`common.not_found`, {
            args: { fieldName: 'id' },
          }),
          HttpStatus.BAD_REQUEST,
        );
      }
      await this._userService.delete(user._id);
      return new ApiResponse({
        status: true,
      });
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

  // Address

  // Get address list of user
  @Post('address/list')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getAddressList(
    @Body() dto: GetAllAddressDto,
    @I18n() i18n: I18nContext,
    @GetUser() user: User,
  ) {
    try {
      const { skip, limit, sort, search } = dto;
      const result = await this._addressService.getAddressList(
        sort,
        search,
        limit,
        skip,
        user.role !== ConstantRoles.SUPER_USER ? user._id : undefined,
      );
      const [{ totalRecords, data }] = result;
      return new ApiResponse({
        ...toListResponse([data, totalRecords?.[0]?.total ?? 0]),
      });
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

  // Get address detail
  @Get('address/:id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getAddressDetail(
    @Param('id') id: string,
    @I18n() i18n: I18nContext,
    @GetUser() user: User,
  ) {
    try {
      await validateFields({ id }, `common.required_field`, i18n);
      const address = await this._addressService.getAddressDetail(
        id,
        user?.role !== ConstantRoles.SUPER_USER ? user._id : undefined,
      );

      if (!address) {
        throw new HttpException(
          await i18n.translate(`common.not_found`, {
            args: { fieldName: 'address' },
          }),
          HttpStatus.BAD_REQUEST,
        );
      }
      return new ApiResponse(address);
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

  // Add new address
  @Post('address')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async addNewAddress(
    @Body() addAddressDto: AddNewAddressDto,
    @I18n() i18n: I18nContext,
    @GetUser() user: User,
  ) {
    try {
      const {
        address,
        country,
        district,
        districtId,
        province,
        provinceId,
        ward,
        wardId,
        zip,
      } = addAddressDto;

      const addressInstance: any = {
        address: address?.trim(),
        country: country?.trim(),
        district: district?.trim(),
        districtId: districtId,
        province: province?.trim(),
        provinceId: provinceId,
        ward: ward?.trim(),
        wardId: wardId,
        zip: zip?.trim(),
        userId: user._id,
      };
      const result = await this._addressService.create(addressInstance);
      return new ApiResponse(result);
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

  // Update address
  @Put('address/:id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async updateAddress(
    @Body() updateAddressDto: Partial<AddNewAddressDto>,
    @I18n() i18n: I18nContext,
    @GetUser() user: User,
    @Param('id') id: string,
  ) {
    try {
      await validateFields(id, `common.required_field`, i18n);

      const existedAddress = await this._addressService.findOne({
        _id: new Types.ObjectId(id),
        ...(user?.role !== ConstantRoles.SUPER_USER && {
          userId: new Types.ObjectId(user._id),
        }),
      });
      if (!existedAddress) {
        throw new HttpException(
          await i18n.translate(`common.not_found`, {
            args: { fieldName: 'address' },
          }),
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this._addressService.update(id, updateAddressDto);
      return new ApiResponse(result);
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

  @Delete('address/:id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async deleteAddress(
    @Param('id') id: string,
    @I18n() i18n: I18nContext,
    @GetUser() user: User,
  ) {
    try {
      await validateFields({ id }, `common.required_field`, i18n);
      const existedAddress = await this._addressService.findOne({
        _id: new Types.ObjectId(id),
        ...(user?.role !== ConstantRoles.SUPER_USER && {
          userId: new Types.ObjectId(user._id),
        }),
      });
      if (!existedAddress) {
        throw new HttpException(
          await i18n.translate(`common.not_found`, {
            args: { fieldName: 'address' },
          }),
          HttpStatus.BAD_REQUEST,
        );
      }
      await this._addressService.delete(id);
      return new ApiResponse({
        status: true,
      });
    } catch (error) {
      throw new HttpException(
        error?.response ??
          (await i18n.translate(`message.internal_server_error`)),
        error?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
