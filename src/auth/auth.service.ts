import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserTokenService } from 'src/user/service/user-token.service';
import { UserService } from 'src/user/service/user.service';
import { JwtPayloadInterface } from './model/jwt.interface';
import { User } from 'src/user/schema/user.schema';
import { UsernameLoginDto } from './dto/username-login.dto';
import { I18nContext } from 'nestjs-i18n';
import { compare } from 'bcryptjs';
import { parsePhoneNumber } from 'libphonenumber-js';
import { ApiResponse } from 'src/shared/response/api.response';
import {
  isValidEmail,
  isPhoneNumberValidation,
  standardPhoneNumber,
} from 'src/shared/utils';
import { IHelperJwtOptions } from 'src/shared/utils/interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AddUserDto } from 'src/user/dto/add-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly _userService: UserService,
    private readonly _userTokenService: UserTokenService,
    private readonly _jwtService: JwtService,
  ) {}
  async login(dto: UsernameLoginDto, i18n: I18nContext) {
    try {
      const { username, isRemember } = dto;
      if (!username) {
        throw new HttpException(
          await i18n.translate(`user.unauthorized`),
          HttpStatus.BAD_REQUEST,
        );
      }
      let user: User;

      //login with Email
      if (isValidEmail(username)) {
        user = await this._userService.findOne({ email: username });
      }

      //login with Phone number?
      if (!user && isPhoneNumberValidation(username)) {
        user = await this._userService.findOne({ mobilePhone: username });
        if (!user) {
          const mobilePhoneParse = parsePhoneNumber(
            standardPhoneNumber(username),
          );
          user = await this._userService.findOne({
            mobilePhone: mobilePhoneParse.number,
          });
        }
      }

      //Login with username
      if (!user) {
        user = await this._userService.findOne({ username });
      }

      if (!user) {
        throw new HttpException(
          await i18n.t(`user.account_not_existed`),
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!user?.isActive) {
        throw new HttpException(
          await i18n.translate(`user.unauthorized_inactive`),
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!user?.isActive) {
        throw new HttpException(
          await i18n.translate(`user.unauthorized_blocked`),
          HttpStatus.BAD_REQUEST,
        );
      }
      const isMatch = user.password
        ? await compare(dto.password?.toString()?.trim(), user.password?.trim())
        : false;
      if (!isMatch) {
        throw new HttpException(
          await i18n.translate(`user.unauthorized`),
          HttpStatus.BAD_REQUEST,
        );
      }

      const accessToken = this.jwtEncrypt(
        {
          mobilePhone: user.mobilePhone,
        },
        {
          expiredIn: isRemember
            ? process.env.EXPIRED_TIME_REMEMBER_LOGGED_IN
            : process.env.JWT_EXPIRED_TIME,
          secretKey: process.env.JWT_PRIVATE_KEY,
        },
      );

      const refreshToken = this.jwtEncrypt(
        {
          accessToken,
          mobilePhone: user.mobilePhone,
        },
        {
          expiredIn: isRemember
            ? process.env.EXPIRED_TIME_REMEMBER_LOGGED_IN
            : process.env.JWT_EXPIRED_TIME,
          secretKey: process.env.JWT_PRIVATE_KEY,
        },
      );

      let tokenData: any = await this._userTokenService.findOne({
        accessToken: accessToken,
      });
      if (!tokenData) {
        tokenData = await this._userTokenService.create({
          userId: user._id,
          mobilePhone: user.mobilePhone,
          accessToken: accessToken,
          refreshToken: refreshToken,
          tokenType: null,
          expiresIn: isRemember
            ? process.env.EXPIRED_TIME_REMEMBER_LOGGED_IN
            : process.env.JWT_EXPIRED_TIME,
          isUserAdmin: true,
        });
      } else {
        tokenData = await this._userTokenService.update(String(tokenData._id), {
          userId: user._id,
          mobilePhone: user.mobilePhone,
          accessToken: accessToken,
          refreshToken: refreshToken,
          tokenType: null,
          expiresIn: isRemember
            ? process.env.EXPIRED_TIME_REMEMBER_LOGGED_IN
            : process.env.JWT_EXPIRED_TIME,
          isUserAdmin: true,
        });
      }
      const accessTokenDecode = this.jwtDecrypt(tokenData.accessToken);
      const lastLoggedInDate = new Date();
      await this._userService.update(user._id, {
        lastLoggedIn: lastLoggedInDate,
      });

      return {
        userId: user._id,
        mobilePhone: user.mobilePhone,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenType: tokenData.tokenType,
        expiresIn: accessTokenDecode?.exp * 1000,
        expiresDate: new Date(accessTokenDecode?.exp * 1000),
        isRemember,
        isActive: user.isActive,
        lastLoggedIn: lastLoggedInDate,
        fullName: user.fullName,
        avatar: user.avatar,
      };
    } catch (e) {
      console.log(
        '🚀 ~ file: auth.service.ts:127 ~ AuthService ~ login ~ e',
        e,
      );
      throw new HttpException(
        await i18n.translate(`user.unauthorized`),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async validateUser(validatePayload: JwtPayloadInterface): Promise<User> {
    const { mobilePhone } = validatePayload;
    return await this._userService.findOne({ mobilePhone });
  }

  jwtEncrypt(payload: Record<string, any>, options: IHelperJwtOptions): string {
    return this._jwtService.sign(payload, {
      secret: process.env.JWT_PRIVATE_KEY,
      expiresIn: options.expiredIn || process.env.JWT_EXPIRED_TIME,
      notBefore: options.notBefore || 0,
    });
  }

  jwtDecrypt(token: string): Record<string, any> {
    return this._jwtService.decode(token) as Record<string, any>;
  }

  jwtVerify(token: string, options?: IHelperJwtOptions): boolean {
    try {
      this._jwtService.verify(token, {
        secret: process.env.JWT_PRIVATE_KEY,
      });
      return true;
    } catch (e) {
      console.log(
        '🚀 ~ file: auth.service.ts:36 ~ AuthService ~ jwtVerify ~ e',
        e,
      );
      return false;
    }
  }

  async refreshToken(dto: RefreshTokenDto, i18n: I18nContext) {
    try {
      const { currentToken, currentRefreshToken, isRemember } = dto;
      const tokenData = await this._userTokenService.findOne({
        accessToken: currentToken,
        refreshToken: currentRefreshToken,
      });
      if (!tokenData) {
        throw new HttpException(
          await i18n.translate(`common.not_found`, {
            args: { fieldName: 'tokenData' },
          }),
          HttpStatus.BAD_REQUEST,
        );
      }
      const { mobilePhone } = tokenData;
      const accessToken = this.jwtEncrypt(
        {
          mobilePhone: standardPhoneNumber(mobilePhone),
        },
        {
          expiredIn: isRemember
            ? process.env.EXPIRED_TIME_REMEMBER_LOGGED_IN
            : process.env.JWT_EXPIRED_TIME,
          secretKey: process.env.JWT_PRIVATE_KEY,
        },
      );

      const refreshToken = this.jwtEncrypt(
        {
          accessToken,
          mobilePhone: standardPhoneNumber(mobilePhone),
        },
        {
          expiredIn: isRemember
            ? process.env.EXPIRED_TIME_REMEMBER_LOGGED_IN
            : process.env.JWT_EXPIRED_TIME,
          secretKey: process.env.JWT_PRIVATE_KEY,
        },
      );
      const accessTokenDecode = this.jwtDecrypt(tokenData.accessToken);
      const updateAccessTokenData = await this._userTokenService.update(
        tokenData._id,
        {
          mobilePhone: standardPhoneNumber(mobilePhone),
          accessToken: accessToken,
          refreshToken: refreshToken,
          tokenType: null,
          expiresIn: isRemember
            ? process.env.EXPIRED_TIME_REMEMBER_LOGGED_IN
            : process.env.JWT_EXPIRED_TIME,
        },
      );

      return {
        _id: updateAccessTokenData._id,
        createdAt: updateAccessTokenData.createdAt,
        updatedAt: updateAccessTokenData.updatedAt,
        userId: updateAccessTokenData.userId,
        mobilePhone: updateAccessTokenData.mobilePhone,
        accessToken: updateAccessTokenData.accessToken,
        refreshToken: updateAccessTokenData.refreshToken,
        tokenType: updateAccessTokenData.tokenType,
        isUserAdmin: updateAccessTokenData.isUserAdmin,
        expiresIn: accessTokenDecode?.exp * 1000,
        expiresDate: new Date(accessTokenDecode?.exp * 1000),
        isRemember,
      };
    } catch (error) {
      console.log(
        '🚀 ~ file: auth.service.ts:36 ~ AuthService ~ jwtVerify ~ e',
        error,
      );
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async logOut(token: any): Promise<any> {
    try {
      //delete user token
      const userToken = await this._userTokenService.findOne({
        accessToken: token,
      });
      if (userToken) {
        await this._userTokenService.delete(userToken._id);
      }
      return true;
    } catch (e) {
      console.log('logout error', e);
      return false;
    }
  }

  async register(dto: AddUserDto, i18n: I18nContext) {
    try {
      await this._userService.addSingleUser(dto, i18n);

      return new ApiResponse({
        status: true,
      });
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
}
