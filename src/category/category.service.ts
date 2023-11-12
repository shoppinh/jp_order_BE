import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseService } from 'src/shared/service/base.service';
import { Category, CategoryDocument } from './schema/category.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategorySortOrder } from './dto/get-all-category.dto';
import { isEmptyObject, validateFields } from 'src/shared/utils';
import { AddNewCategoryDto } from './dto/add-new-category.dto';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class CategoryService extends BaseService<Category> {
  constructor(
    @InjectModel(Category.name) readonly model: Model<CategoryDocument>,
  ) {
    super();
    this.model = model;
  }

  async getCategoryList(
    sort: CategorySortOrder,
    search: string,
    limit: number,
    skip: number,
  ) {
    const aggregation = this.model.aggregate();
    const paginationStage = [];
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

  async addSingleCategory(
    addNewCategoryDto: AddNewCategoryDto,
    i18n: I18nContext,
  ) {
    try {
      const { name, description, label } = addNewCategoryDto;
      const categoryInstance = {
        name,
        description,
        label,
      };
      await validateFields({ name }, `common.required_field`, i18n);
      return await this.model.create(categoryInstance);
    } catch (error) {
      console.log('error', error);
      throw new HttpException(
        error?.response ??
          (await i18n.translate(`message.internal_server_error`)),
        error?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }
}
