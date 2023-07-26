import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/shared/service/base.service';
import { Address, AddressDocument } from './schema/address.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AddressService extends BaseService<Address> {
  constructor(
    @InjectModel(Address.name) readonly _addressModel: Model<AddressDocument>,
  ) {
    super();
    this.model = _addressModel;
  }
}
