import { Module } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { PaymentsController } from './payments.controller'
import { ConfigModule } from 'src/config/config.module'
import { CaslModule } from 'src/casl/casl.module'
import { FondyModule } from './fondy/fondy.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Payment } from './payment.entity'
import { PaymentsConnector } from './payments.connector'

@Module({
  imports: [
    ConfigModule,
    CaslModule,
    FondyModule,
    TypeOrmModule.forFeature([Payment]),
  ],
  providers: [PaymentsService, PaymentsConnector],
  exports: [PaymentsConnector],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
