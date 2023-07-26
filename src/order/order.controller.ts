import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Get,
  Put,
  Delete,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/shared/decorator/roles.decorator';
import { ConstantRoles } from 'src/shared/utils/constant/role';
import { ApiException } from 'src/shared/type/api-exception.model';
import { GetAllOrderDto } from './dto/get-all-order.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiResponse } from 'src/shared/response/api.response';
import { toListResponse, validateFields } from 'src/shared/utils';
import { GetUser } from 'src/shared/decorator/current-user.decorator';
import { User } from 'src/user/schema/user.schema';
import { Types } from 'mongoose';
import { AddNewOrderDto } from './dto/add-new-order.dto';
import { AddressService } from 'src/address/address.service';

@Controller('api/order')
@ApiTags('Order')
@ApiHeader({ name: 'locale', description: 'en' })
@ApiHeader({ name: 'version', description: '1' })
export class OrderController {
  constructor(
    private readonly _orderService: OrderService,
    private readonly _addressService: AddressService,
  ) {}

  @Post('list')
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(ConstantRoles.SUPER_USER)
  @ApiBearerAuth()
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getAllOrder(@Body() dto: GetAllOrderDto, @I18n() i18n: I18nContext) {
    try {
      const { limit, search, skip, sort } = dto;
      const result = await this._orderService.getOrderList(
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

  @Post('list-by-user')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getAllOrderByUser(
    @Body() dto: GetAllOrderDto,
    @I18n() i18n: I18nContext,
    @GetUser() user: User,
  ) {
    try {
      const { limit, search, skip, sort } = dto;
      const result = await this._orderService.getOrderList(
        sort,
        search,
        skip,
        limit,
        user._id,
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

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getOrderDetails(
    @Param('id') id: string,
    @I18n() i18n: I18nContext,
    @GetUser() user: User,
  ) {
    try {
      await validateFields({ id }, 'common.required_field', i18n);
      if (user.role !== ConstantRoles.SUPER_USER) {
        const result = await this._orderService.getOrderDetails(
          new Types.ObjectId(id),
          new Types.ObjectId(user._id),
        );
        return new ApiResponse(result);
      } else {
        const result = await this._orderService.getOrderDetails(
          new Types.ObjectId(id),
        );
        return new ApiResponse(result);
      }
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
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async addNewOrder(
    @Body() dto: Partial<AddNewOrderDto>,
    @I18n() i18n: I18nContext,
    @GetUser() user: User,
  ) {
    try {
      const { addressId, items, status, totalPrice, totalWeight } = dto;
      await validateFields({ addressId }, 'common.required_field', i18n);
      const existedAddress = await this._addressService.findById(addressId);
      if (!existedAddress) {
        throw new HttpException(
          await i18n.translate(`address.address_not_found`),
          HttpStatus.BAD_REQUEST,
        );
      }
      const orderInstance = {
        addressId: new Types.ObjectId(addressId),
        items,
        status,
        totalPrice,
        totalWeight,
        userId: new Types.ObjectId(user._id),
      };
      const result = await this._orderService.create(orderInstance);
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
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(ConstantRoles.SUPER_USER)
  @ApiBearerAuth()
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async updateOrder(
    @Body() dto: Partial<AddNewOrderDto>,
    @Param('id') id: string,
    @I18n() i18n: I18nContext,
    @GetUser() user: User,
  ) {
    try {
      await validateFields({ id }, 'common.required_field', i18n);
      const { addressId, items, status, totalPrice, totalWeight } = dto;
      const existedAddress = await this._addressService.findById(addressId);
      if (!existedAddress) {
        throw new HttpException(
          await i18n.translate(`address.address_not_found`),
          HttpStatus.BAD_REQUEST,
        );
      }
      const existedOrder = await this._orderService.findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(user._id),
      });
      if (!existedOrder) {
        throw new HttpException(
          await i18n.translate(`order.order_not_found`),
          HttpStatus.BAD_REQUEST,
        );
      }
      const orderInstance = {
        addressId: new Types.ObjectId(addressId),
        items,
        status,
        totalPrice,
        totalWeight,
      };
      const result = await this._orderService.update(id, orderInstance);
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
}
