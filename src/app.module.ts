import { Module } from '@nestjs/common'
import { ConfigModule } from './config/config.module'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './auth/auth.module'
import { User } from './users/user.entity'
import { ConfigService } from './config/config.service'
import { Order } from './orders/order.entity'
import { DeliveryType } from './delivery-type/delivery-type.entity'
import { PaymentsModule } from './payments/payments.module'
import { ReportType } from './report-type/report-type.entity'
import { Payment } from './payments/payment.entity'
import { UsersModule } from './users/users.module'
import { FileEntity } from './files/file.entity'

@Module({
  imports: [
    NestConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.getNumber('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, Order, Payment, DeliveryType, ReportType, FileEntity],
        synchronize: true,
      }),
    }),
    AuthModule,
    PaymentsModule,
    UsersModule,
    ConfigModule,
  ],
})
export class AppModule {}
