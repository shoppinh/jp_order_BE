import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from 'src/shared/schema/base.schema';
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIMEZONE,
} from 'src/shared/utils/constant';
import { PaymentRate, TaxRate } from 'src/shared/utils/constant/payment';

export type SettingDocument = Document & Setting;

@Schema()
export class Setting extends BaseSchema {
  @Prop({
    required: true,
    default: process.env.APP_ID,
  })
  appId: string;
  @Prop({
    required: true,
    default: TaxRate.CASUAL_RATE,
  })
  taxRate: number;

  @Prop({
    required: true,
    default: PaymentRate.CASUAL_RATE,
  })
  paymentRate: number;

  @Prop({
    required: false,
    default: process.env.DEFAULT_LANGUAGE,
  })
  language: string;

  @Prop({
    required: false,
    default: DEFAULT_DATE_FORMAT,
  })
  dateFormat: string;

  @Prop({
    required: false,
    default: DEFAULT_TIMEZONE,
  })
  timezone: string;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
