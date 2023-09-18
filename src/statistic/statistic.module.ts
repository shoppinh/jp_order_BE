import { Module } from '@nestjs/common';
import { StatisticController } from './statistic.controller';
import { StatisticService } from './statistic.service';
import { UserModule } from 'src/user/user.module';
import { ProductModule } from 'src/product/product.module';
import { OrderModule } from 'src/order/order.module';

@Module({
  controllers: [StatisticController],
  providers: [StatisticService],
  imports: [UserModule, ProductModule, OrderModule],
})
export class StatisticModule {}
