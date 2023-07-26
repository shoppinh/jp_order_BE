import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/shared/service/base.service';
import { Order, OrderDocument } from './schema/order.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderSortOrder } from './dto/get-all-order.dto';
import { isEmptyObject } from 'src/shared/utils';

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
    const aggregation = this.model.aggregate();
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
      aggregation.match({
        $or: [
          {
            name: { $eq: search },
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

  async getOrderDetails(orderId: Types.ObjectId, userId?: Types.ObjectId) {
    const aggregation = this.model.aggregate();
    aggregation.match({
      $or: [
        {
          _id: { $eq: orderId },
        },
      ],
    });
    if (userId) {
      aggregation.match({
        $or: [
          {
            userId: { $eq: userId },
          },
        ],
      });
    }
    return aggregation.exec();
  }
}
