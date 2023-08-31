import { Module } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from './order.entity'
import { DeliveryType } from 'src/delivery-type/delivery-type.entity'
import { OrdersController } from './orders.controller'
import { CaslModule } from 'src/casl/casl.module'
import { ConfigModule } from 'src/config/config.module'
import { PaymentsModule } from 'src/payments/payments.module'
import { ReportType } from 'src/report-type/report-type.entity'
import { FilesModule } from 'src/files/files.module'
import { ChatModule } from 'src/chat/chat.module'
import { OrderFile } from './order-file.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderFile, DeliveryType, ReportType]),
    CaslModule,
    ConfigModule,
    PaymentsModule,
    ChatModule,
    FilesModule,
  ],
  exports: [OrdersService],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
