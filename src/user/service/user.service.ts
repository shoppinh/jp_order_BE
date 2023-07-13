import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseService } from 'src/shared/service/base.service';
import { User, UserDocument } from '../schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSortOrder } from 'src/shared/type/user';
import {
  isEmptyObject,
  isPhoneNumberValidation,
  isValidEmail,
  passwordGenerate,
  validateFields,
} from 'src/shared/utils';
import { AddUserDto } from '../dto/add-user.dto';
import { I18nContext } from 'nestjs-i18n';
import { RoleService } from './role.service';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    @InjectModel(User.name) readonly modelUser: Model<UserDocument>,
    private readonly _roleService: RoleService,
  ) {
    super();
    this.model = modelUser;
  }

  async getUserList(
    sort: Partial<UserSortOrder>,
    search: string,
    limit: number,
    skip: number,
  ) {
    const aggregation = this.modelUser.aggregate().project({ password: 0 });
    const paginationStage = [];
    if (search) {
      aggregation.match({
        $or: [
          {
            username: { $eq: search },
          },
          {
            mobilePhone: { $eq: search },
          },
          {
            email: { $eq: search },
          },
        ],
      });
    }
    if (skip) {
      paginationStage.push({
        $skip: skip,
      });
    }
    if (limit) {
      paginationStage.push({
        $limit: limit,
      });
    }

    if (sort && !isEmptyObject(sort)) {
      aggregation.sort(sort).collation({ locale: 'en' });
    }
    return aggregation
      .facet({
        totalRecords: [
          {
            $count: 'total',
          },
        ],
        data: paginationStage,
      })
      .exec();
  }

  async addSingleUser(userDto: AddUserDto, i18n: I18nContext) {
    const {
      mobilePhone,
      username,
      email,
      firstName,
      lastName,
      avatar,
      fullName,
      isActive,
      roleKey,
      password,
    } = userDto;
    await validateFields(
      { mobilePhone, email, username, roleKey, password },
      `common.required_field`,
      i18n,
    );

    if (!isPhoneNumberValidation(mobilePhone)) {
      throw new HttpException(
        await i18n.translate(`user.phone_invalid_field`),
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!isValidEmail(email)) {
      throw new HttpException(
        await i18n.translate(`user.email_invalid_field`),
        HttpStatus.BAD_REQUEST,
      );
    }

    //Check Email
    const userExistedEmail = await this.model.findOne({ email });
    if (userExistedEmail?._id) {
      throw new HttpException(
        await i18n.translate('message.existed_email'),
        HttpStatus.CONFLICT,
      );
    }
    //Check if role exists
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
    //Check phone
    const userExistedPhone = await this.model.findOne({ mobilePhone });
    if (userExistedPhone?._id) {
      throw new HttpException(
        await i18n.translate('message.existed_phone_number'),
        HttpStatus.CONFLICT,
      );
    }
    const hashPassword = await passwordGenerate(password);

    const userInstance: any = {
      mobilePhone,
      username,
      email,
      isActive,
      firstname: firstName,
      lastname: lastName,
      fullname: fullName,
      avatar,
      role: roleKey,
      password: hashPassword,
    };

    return await this.model.create(userInstance);
  }
}
