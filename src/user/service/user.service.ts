import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseService } from 'src/shared/service/base.service';
import { User, UserDocument } from '../schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSortOrder } from 'src/shared/type/user';
import {
  getRandomCode,
  isEmptyObject,
  isPhoneNumberValidation,
  isProductionEnv,
  isValidEmail,
  passwordGenerate,
  printLog,
  standardPhoneNumber,
  validateFields,
} from 'src/shared/utils';
import { AddUserDto } from '../dto/add-user.dto';
import { I18nContext } from 'nestjs-i18n';
import { RoleService } from './role.service';
import { UserActiveService } from './user-active.service';
import { OtpLoginDto } from '../dto/otp-login.dto';
import { ConstantUser } from '../../shared/utils/constant';
import { UserActives } from '../schema/user-active.schema';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    @InjectModel(User.name) readonly modelUser: Model<UserDocument>,
    private readonly _roleService: RoleService,
    private readonly _userActiveService: UserActiveService,
  ) {
    super();
    this.model = modelUser;
  }

  async getUserList(
    sort: Partial<UserSortOrder>,
    search: string,
    limit: number,
    skip: number,
    role: string,
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
    if (role) {
      aggregation.match({ role: role });
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
      dob,
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
      dob: new Date(dob),
    };

    return await this.model.create(userInstance);
  }

  async sendOtpToUser(user: User, i18n: I18nContext) {
    let userActive: UserActives = await this._userActiveService.findOne({
      mobilePhone: standardPhoneNumber(user.mobilePhone),
    });
    const smsCode =
      ConstantUser.REVIEW_PHONE_NUMBER.concat(
        ConstantUser.ADMIN_PHONE_NUMBERS,
      ).indexOf(user.mobilePhone) > -1
        ? ConstantUser.REVIEW_PHONE_NUMBER_OTP
        : getRandomCode();
    const data = {
      mobilePhone: standardPhoneNumber(user.mobilePhone),
      smsCode,
      status: ConstantUser.STEP_VERIFIED_SMS_CODE,
      codeExpiredSecond: ConstantUser.CODE_EXPIRED_SECONDS,
    };

    if (!userActive) {
      userActive = await this._userActiveService.create(data);
    } else {
      userActive = await this._userActiveService.update(userActive._id, data);
    }
    await this.update(user?._id, { status: ConstantUser.IS_ACTIVE });

    // if (
    //   user?.isSmsSend &&
    //   ConstantUser.REVIEW_PHONE_NUMBER.indexOf(user.mobilePhone) <= -1
    // ) {
    //   sendSMS(
    //     await i18n.translate(`user.your_dsr_verification_code`, {
    //       args: { code: smsCode },
    //     }),
    //     '',
    //     standardPhoneNumber(user.mobilePhone),
    //   );
    // }

    return userActive;
  }

  async resendOtp(dto: OtpLoginDto, i18n: I18nContext) {
    try {
      const user = await this.model.findOne({ username: dto.username });
      const { mobilePhone } = user;
      let userActive: UserActives = await this._userActiveService.findOne({
        mobilePhone: standardPhoneNumber(mobilePhone),
      });

      if (!userActive) {
        throw new HttpException(
          await i18n.translate(`user.sms_invalid_field`),
          HttpStatus.BAD_REQUEST,
        );
      }
      const { createdAt } = userActive;
      const now = new Date().getTime();
      const getTimeCreateAt = new Date(createdAt).getTime();

      const secondBetween = Math.abs((now - getTimeCreateAt) / 1000);

      if (secondBetween > ConstantUser.CODE_EXPIRED_SECONDS) {
        const smsCode = getRandomCode();
        const data = {
          mobilePhone: standardPhoneNumber(mobilePhone),
          smsCode,
          status: ConstantUser.RESEND_OTP,
          codeExpiredSecond: ConstantUser.CODE_EXPIRED_SECONDS,
        };
        if (!userActive) {
          userActive = await this._userActiveService.create(data);
        } else {
          userActive = await this._userActiveService.update(
            userActive._id,
            data,
          );
        }

        // if (user?.isSmsSend) {
        //   sendSMS(
        //     await i18n.translate(`user.your_dsr_verification_code`, {
        //       args: { code: smsCode },
        //     }),
        //     '',
        //     standardPhoneNumber(mobilePhone),
        //   ).then();
        // }
        return {
          mobilePhone: userActive?.mobilePhone,
          smsCode: !isProductionEnv() ? userActive?.smsCode : '',
          codeExpiredSecond: ConstantUser.CODE_EXPIRED_SECONDS,
        };
      }
      throw new HttpException('Do not resend otp', HttpStatus.BAD_REQUEST);
    } catch (error) {
      printLog(error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
