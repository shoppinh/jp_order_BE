import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiException } from 'src/shared/type/api-exception.model';
import { GetAllProductDto } from './dto/get-all-product.dto';
import { ApiResponse } from 'src/shared/response/api.response';
import { toListResponse, validateFields } from 'src/shared/utils';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { ConstantRoles } from 'src/shared/utils/constant/role';
import { Roles } from 'src/shared/decorator/roles.decorator';
import { AddNewProductDto } from './dto/add-new-product.dto';
import { CategoryService } from 'src/category/category.service';
@Controller('api/product')
@ApiTags('Product')
@ApiHeader({ name: 'locale', description: 'en' })
@ApiHeader({ name: 'version', description: '1' })
export class ProductController {
  constructor(
    private readonly _productService: ProductService,
    private readonly _categoryService: CategoryService,
  ) {}

  @Post('list')
  @ApiBearerAuth()
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getAllProduct(
    @Body() getAllProductDto: GetAllProductDto,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { skip, limit, sort, search } = getAllProductDto;

      const result = await this._productService.getProductList(
        sort,
        search,
        skip,
        limit,
      );
      const [{ totalRecords, data }] = result;
      return new ApiResponse({
        ...toListResponse([data, totalRecords?.[0]?.total ?? 0]),
      });
    } catch (error) {
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

  @Post('')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(ConstantRoles.SUPER_USER)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async addNewProduct(
    @Body() dto: AddNewProductDto,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const {
        name,
        categoryId,
        price,
        imageAttachments,
        description,
        SKU,
        quantity,
      } = dto;

      await validateFields(
        { name, categoryId, SKU },
        `common.required_field`,
        i18n,
      );

      const existedCategory = await this._categoryService.findById(categoryId);
      if (!existedCategory?._id) {
        throw new HttpException(
          await i18n.translate(`message.category_not_found`),
          HttpStatus.BAD_REQUEST,
        );
      }
      const existedProduct = await this._productService.findOne({
        SKU,
      });
      if (existedProduct?._id) {
        throw new HttpException(
          await i18n.translate(`message.product_existed`),
          HttpStatus.BAD_REQUEST,
        );
      }
      const productInstance = {
        name,
        categoryId,
        price,
        imageAttachments,
        description,
        SKU,
        quantity,
      };
      const result = await this._productService.create(productInstance);
      return new ApiResponse(result);
    } catch (error) {
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

  @Get(':id')
  @ApiBearerAuth()
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getProductDetail(@Param('id') id: string, @I18n() i18n: I18nContext) {
    try {
      await validateFields({ id }, `common.required_field`, i18n);
      const result = await this._productService.findById(id);
      if (!result?._id) {
        throw new HttpException(
          await i18n.translate(`message.product_not_found`),
          HttpStatus.BAD_REQUEST,
        );
      }
      return new ApiResponse(result);
    } catch (error) {
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

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(ConstantRoles.SUPER_USER)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: Partial<AddNewProductDto>,
    @I18n() i18n: I18nContext,
  ) {
    try {
      await validateFields({ id }, `common.required_field`, i18n);
      const {
        name,
        SKU,
        categoryId,
        price,
        imageAttachments,
        description,
        quantity,
        productSrcURL,
      } = dto;

      const existedCategory = await this._categoryService.findById(categoryId);
      if (!existedCategory?._id) {
        throw new HttpException(
          await i18n.translate(`message.category_not_found`),
          HttpStatus.BAD_REQUEST,
        );
      }
      const existedProduct = await this._productService.findById(id);
      if (!existedProduct?._id) {
        throw new HttpException(
          await i18n.translate(`message.product_not_found`),
          HttpStatus.BAD_REQUEST,
        );
      }
      const productInstance = {
        name,
        SKU,
        categoryId,
        price,
        imageAttachments,
        description,
        quantity,
        productSrcURL,
      };
      const result = await this._productService.update(id, productInstance);
      return new ApiResponse(result);
    } catch (error) {
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

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(ConstantRoles.SUPER_USER)
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async deleteProduct(@Param('id') id: string, @I18n() i18n: I18nContext) {
    try {
      await validateFields({ id }, `common.required_field`, i18n);
      const existedProduct = await this._productService.findById(id);
      if (!existedProduct?._id) {
        throw new HttpException(
          await i18n.translate(`message.product_not_found`),
          HttpStatus.BAD_REQUEST,
        );
      }
      await this._productService.delete(id);
      return new ApiResponse({ status: true });
    } catch (error) {
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
