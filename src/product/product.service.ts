import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from 'src/shared/service/base.service';
import { isEmptyObject } from 'src/shared/utils';
import { ProductSortOrder } from './dto/get-all-product.dto';
import { Product, ProductDocument } from './schema/product.schema';

@Injectable()
export class ProductService extends BaseService<Product> {
  constructor(
    @InjectModel(Product.name) readonly model: Model<ProductDocument>,
  ) {
    super();
    this.model = model;
  }

  async getProductList(
    sort: ProductSortOrder,
    search: string,
    skip: number,
    limit: number,
  ) {
    const aggregation = this.model.aggregate();
    const paginationStage = [];
    if (search) {
      aggregation.match({
        $or: [
          {
            name: { $eq: search },
          },
          {
            SKU: { $eq: search },
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
}
