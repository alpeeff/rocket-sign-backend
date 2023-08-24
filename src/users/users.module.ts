import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { OrdersModule } from 'src/orders/orders.module'

@Module({
  imports: [OrdersModule],
  controllers: [UsersController],
})
export class UsersModule {}
