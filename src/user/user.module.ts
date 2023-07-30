import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { Role, RoleSchema } from './schema/role.schema';
import { UserToken, UserTokenSchema } from './schema/user-token.schema';
import { UserController } from './user.controller';
import { UserService } from './service/user.service';
import { RoleService } from './service/role.service';
import { UserTokenService } from './service/user-token.service';
import { UserDeviceService } from './service/user-device.service';
import { UserDevice, UserDeviceSchema } from './schema/user-device.schema';
import { Address, AddressSchema } from './schema/address.schema';
import { AddressService } from './service/address.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Role.name,
        schema: RoleSchema,
      },
      {
        name: UserToken.name,
        schema: UserTokenSchema,
      },
      {
        name: UserDevice.name,
        schema: UserDeviceSchema,
      },
      {
        name: Address.name,
        schema: AddressSchema,
      },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    RoleService,
    UserTokenService,
    UserDeviceService,
    AddressService,
  ],
  exports: [
    UserService,
    RoleService,
    UserTokenService,
    UserDeviceService,
    AddressService,
  ],
})
export class UserModule {}
