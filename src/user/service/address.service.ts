import { BaseService } from 'src/shared/service/base.service';
import { Address, AddressDocument } from '../schema/address.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AddressSortOrder } from '../dto/get-all-address.dto';
import { isEmptyObject } from 'src/shared/utils';

export class AddressService extends BaseService<Address> {
  constructor(
    @InjectModel(Address.name)
    readonly _addressModel: Model<AddressDocument>,
  ) {
    super();
    this.model = _addressModel;
  }

  async getAddressList(
    sort: AddressSortOrder,
    search: string,
    limit: number,
    skip: number,
    userId?: string,
  ) {
    const aggregation = this.model
      .aggregate()
      .project({ password: 0 })
      .lookup({
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      })
      .unwind({
        path: '$user',
        preserveNullAndEmptyArrays: true,
      });

    const paginationStage = [];
    if (userId) {
      aggregation.match({
        userId: { $eq: userId },
      });
    }
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

  async getAddressDetail(id: string, userId?: string) {
    return this.model
      .findOne({
        _id: id,
        ...(userId && {
          userId: userId,
        }),
      })
      .exec();
  }
}
