import { Injectable } from '@nestjs/common';
import { BaseService } from '../../shared/service/base.service';
import { UserActiveDocument, UserActives } from '../schema/user-active.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UserActiveService extends BaseService<UserActives> {
  constructor(
    @InjectModel(UserActives.name)
    private readonly modelUserActive: Model<UserActiveDocument>,
  ) {
    super();
    this.model = modelUserActive;
  }
}
