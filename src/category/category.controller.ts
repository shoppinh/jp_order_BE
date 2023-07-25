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
import { CategoryService } from './category.service';
import { GetAllCategoryDto } from './dto/get-all-category.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiException } from 'src/shared/type/api-exception.model';
import { ApiResponse } from 'src/shared/response/api.response';
import { toListResponse, validateFields } from 'src/shared/utils';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/shared/decorator/roles.decorator';
import { ConstantRoles } from 'src/shared/utils/constant/role';
import { AddNewCategoryDto } from './dto/add-new-category.dto';

@Controller('api/category')
@ApiTags('Category')
@ApiHeader({ name: 'locale', description: 'en' })
@ApiHeader({ name: 'version', description: '1' })
export class CategoryController {
  constructor(private readonly _categoryService: CategoryService) {}

  @Post('list')
  @ApiBearerAuth()
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getAllCategory(
    @Body() getAllCategoryDto: GetAllCategoryDto,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { skip, limit, sort, search } = getAllCategoryDto;

      const result = await this._categoryService.getCategoryList(
        sort,
        search,
        limit,
        skip,
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
  async addNewCategory(
    @Body() addNewCategoryDto: AddNewCategoryDto,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const result = await this._categoryService.addSingleCategory(
        addNewCategoryDto,
        i18n,
      );
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
  async getCategoryById(@Param('id') id: string, @I18n() i18n: I18nContext) {
    try {
      await validateFields({ id }, `common.required_field`, i18n);
      const result = await this._categoryService.findById(id);
      if (!result) {
        throw new HttpException(
          await i18n.translate(`common.not_found`, {
            args: { fieldName: 'category' },
          }),
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
  async updateCategoryById(
    @Param('id') id: string,
    @Body() updateCategoryDto: Partial<AddNewCategoryDto>,
    @I18n() i18n: I18nContext,
  ) {
    try {
      await validateFields({ id }, `common.required_field`, i18n);
      const existedCategory = await this._categoryService.findById(id);
      if (!existedCategory?._id) {
        throw new HttpException(
          await i18n.translate('message.nonexistent_category'),
          HttpStatus.CONFLICT,
        );
      }
      const updatedUser = await this._categoryService.update(
        id,
        updateCategoryDto,
      );
      return new ApiResponse(updatedUser);
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
  async deleteCategoryById(@Param('id') id: string, @I18n() i18n: I18nContext) {
    try {
      await validateFields({ id }, `common.required_field`, i18n);
      const existedCategory = await this._categoryService.findById(id);
      if (!existedCategory?._id) {
        throw new HttpException(
          await i18n.translate('message.nonexistent_category'),
          HttpStatus.CONFLICT,
        );
      }
      await this._categoryService.delete(id);
      return new ApiResponse({
        status: true,
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
}
