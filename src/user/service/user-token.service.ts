import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/shared/service/base.service';
import { UserToken, UserTokenDocument } from '../schema/user-token.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UserTokenService extends BaseService<UserToken> {
  constructor(
    @InjectModel(UserToken.name)
    readonly modelUserToken: Model<UserTokenDocument>,
  ) {
    super();
    this.model = modelUserToken;
  }
}
