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
import { OrderService } from './service/order.service';
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
import { AddressService } from 'src/user/service/address.service';
import { OrderProductService } from './service/order-product.service';
import { ProductService } from 'src/product/service/product.service';

@Controller('api/order')
@ApiTags('Order')
@ApiHeader({ name: 'locale', description: 'en' })
@ApiHeader({ name: 'version', description: '1' })
export class OrderController {
  constructor(
    private readonly _orderService: OrderService,
    private readonly _orderProductService: OrderProductService,
    private readonly _productService: ProductService,
    private readonly _addressService: AddressService,
  ) {}

  @Post('list')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(
    ConstantRoles.SUPER_USER,
    ConstantRoles.ACCOUNTANT,
    ConstantRoles.STORAGE_MANAGER,
    ConstantRoles.CUSTOMER,
  )
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getAllOrder(
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
        user?.role !== ConstantRoles.CUSTOMER ? undefined : user._id,
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
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(
    ConstantRoles.SUPER_USER,
    ConstantRoles.ACCOUNTANT,
    ConstantRoles.STORAGE_MANAGER,
  )
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async getOrderDetails(
    @Param('id') id: string,
    @I18n() i18n: I18nContext,
    @GetUser() user: User,
  ) {
    try {
      await validateFields({ id }, 'common.required_field', i18n);
      const result = await this._orderService.findOne({
        _id: new Types.ObjectId(id),
        ...(user.role !== ConstantRoles.SUPER_USER && {
          userId: new Types.ObjectId(user._id),
        }),
      });
      if (!result) {
        throw new HttpException(
          await i18n.translate(`order.order_not_found`),
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

  @Post('')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(
    ConstantRoles.SUPER_USER,
    ConstantRoles.ACCOUNTANT,
    ConstantRoles.CUSTOMER,
  )
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async addNewOrder(
    @Body() dto: Partial<AddNewOrderDto>,
    @I18n() i18n: I18nContext,
    @GetUser() user: User,
  ) {
    try {
      const {
        addressId,
        items,
        status,
        totalPrice,
        totalWeight,
        fullName,
        phone,
        guestAddress,
      } = dto;
      if (addressId) {
        // Address existence check
        const existedAddress = await this._addressService.findById(addressId);
        if (!existedAddress) {
          throw new HttpException(
            await i18n.translate(`address.address_not_found`),
            HttpStatus.BAD_REQUEST,
          );
        }
      } else if (!guestAddress) {
        throw new HttpException(
          await i18n.translate(`address.address_required`),
          HttpStatus.BAD_REQUEST,
        );
      }
      // Product existence check
      const productIds = items.map((item) => new Types.ObjectId(item._id));
      const existedProducts = await this._productService.findAll({
        _id: { $in: productIds },
      });
      if (existedProducts.length !== productIds.length) {
        throw new HttpException(
          await i18n.translate(`product.product_not_found`),
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check total price
      const calculatedTotalPrice = items.reduce((acc, cur) => {
        return acc + cur.taxTotal;
      }, 0);
      if (calculatedTotalPrice !== totalPrice) {
        throw new HttpException(
          await i18n.translate(`order.total_price_not_match`),
          HttpStatus.BAD_REQUEST,
        );
      }
      const orderInstance = {
        ...(addressId
          ? { addressId: new Types.ObjectId(addressId) }
          : { guestAddress }),
        items: productIds,
        status,
        totalPrice,
        totalWeight,
        ...(user.role === ConstantRoles.CUSTOMER
          ? {
              userId: new Types.ObjectId(user._id),
            }
          : {
              fullName: fullName ?? user.fullName,
              phone: phone ?? user.mobilePhone,
            }),
      };
      const result = await this._orderService.create(orderInstance);

      // Create order products
      const orderProducts = items.map((item) => ({
        orderId: new Types.ObjectId(result._id),
        productId: new Types.ObjectId(item._id),
        quantity: item.quantity,
        price: item.price,
        preTaxTotal: item.preTaxTotal,
        tax: item.tax,
        taxTotal: item.taxTotal,
      }));
      await this._orderProductService.createMany(orderProducts);
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
  @Roles(
    ConstantRoles.SUPER_USER,
    ConstantRoles.ACCOUNTANT,
    ConstantRoles.STORAGE_MANAGER,
  )
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
      // Only update address and status
      const { addressId, status } = dto;
      if (addressId) {
        const existedAddress = await this._addressService.findById(addressId);
        if (!existedAddress) {
          throw new HttpException(
            await i18n.translate(`address.address_not_found`),
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Order existence check
      const existedOrder = await this._orderService.findOne({
        _id: new Types.ObjectId(id),
        ...(user.role !== ConstantRoles.SUPER_USER && {
          userId: new Types.ObjectId(user._id),
        }),
      });
      if (!existedOrder) {
        throw new HttpException(
          await i18n.translate(`order.order_not_found`),
          HttpStatus.BAD_REQUEST,
        );
      }
      const orderInstance = {
        ...(addressId && { addressId: new Types.ObjectId(addressId) }),
        status,
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

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(ConstantRoles.SUPER_USER, ConstantRoles.ACCOUNTANT)
  @ApiBearerAuth()
  @ApiBadRequestResponse({ type: ApiException })
  @HttpCode(HttpStatus.OK)
  async deleteOrder(
    @Param('id') id: string,
    @I18n() i18n: I18nContext,
    @GetUser() user: User,
  ) {
    try {
      await validateFields({ id }, 'common.required_field', i18n);

      const existedOrder = await this._orderService.findOne({
        _id: new Types.ObjectId(id),
        ...(user.role !== ConstantRoles.SUPER_USER && {
          userId: new Types.ObjectId(user._id),
        }),
      });
      if (!existedOrder) {
        throw new HttpException(
          await i18n.translate(`order.order_not_found`),
          HttpStatus.BAD_REQUEST,
        );
      }
      const result = await this._orderService.delete(id);
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
