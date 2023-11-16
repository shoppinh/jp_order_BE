import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OrderProduct,
  OrderProductDocument,
} from 'src/order/schema/order-product.schema';
import { BaseService } from 'src/shared/service/base.service';

@Injectable()
export class OrderProductService extends BaseService<OrderProduct> {
  constructor(
    @InjectModel(OrderProduct.name)
    readonly _orderProductModel: Model<OrderProductDocument>,
  ) {
    super();
    this.model = _orderProductModel;
  }
}
