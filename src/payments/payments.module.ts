import { Module } from '@nestjs/common'
import { PaymentsService } from './payments.service'
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
})
export class PaymentsModule {}
