import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/shared/service/base.service';
import { Order, OrderDocument } from '../schema/order.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderSortOrder } from '../dto/get-all-order.dto';
import { isEmptyObject } from 'src/shared/utils';
import { normalizeQueryHelper } from 'src/shared/helpers/normalize-query.helpler';

@Injectable()
export class OrderService extends BaseService<Order> {
  constructor(
    @InjectModel(Order.name) readonly _orderModel: Model<OrderDocument>,
  ) {
    super();
    this.model = _orderModel;
  }

  async getOrderList(
    sort: OrderSortOrder,
    search: string,
    skip: number,
    limit: number,
    userId?: string,
  ) {
    const aggregation = this.model
      .aggregate()
      .lookup({
        from: 'addresses',
        localField: 'addressId',
        foreignField: '_id',
        as: 'address',
      })
      .unwind({
        path: '$address',
        preserveNullAndEmptyArrays: true,
      })
      .lookup({
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      })
      .unwind({
        path: '$user',
        preserveNullAndEmptyArrays: true,
      })
      .lookup({
        from: 'orderproducts',
        localField: 'items',
        foreignField: 'productId',
        as: 'items',
      });
    const paginationStage = [];
    if (userId) {
      aggregation.match({
        $or: [
          {
            userId: { $eq: userId },
          },
        ],
      });
    }
    if (search) {
      const normalizedQuery = normalizeQueryHelper(search);
      aggregation.match({
        $or: [
          {
            name: new RegExp(normalizedQuery, 'i'),
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

    aggregation.project({
      addressId: 0,
      userId: 0,
      __v: 0,
    });
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
}
