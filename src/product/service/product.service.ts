import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from 'src/shared/service/base.service';
import { isEmptyObject } from 'src/shared/utils';
import { ProductSortOrder } from '../dto/get-all-product.dto';
import { Product, ProductDocument } from '../schema/product.schema';
import { normalizeQueryHelper } from 'src/shared/helpers/normalize-query.helpler';

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
    aggregation
      .lookup({
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category',
      })
      .project({
        categoryId: 0,
        __v: 0,
      });
    const paginationStage = [];
    if (search) {
      const normalizedQuery = normalizeQueryHelper(search);
      aggregation.match({
        $or: [
          {
            name: new RegExp(normalizedQuery, 'i'),
          },
          {
            SKU: new RegExp(normalizedQuery, 'i'),
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
