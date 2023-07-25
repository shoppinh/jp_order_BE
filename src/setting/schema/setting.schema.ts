import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from 'src/shared/schema/base.schema';
import { PaymentRate, TaxRate } from 'src/shared/utils/constant/payment';

export type SettingDocument = Document & Setting;

@Schema()
export class Setting extends BaseSchema {
  @Prop({
    required: true,
    default: TaxRate.CASUAL_RATE,
  })
  texRate: number;

  @Prop({
    required: true,
    default: PaymentRate.CASUAL_RATE,
  })
  paymentRate: number;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
