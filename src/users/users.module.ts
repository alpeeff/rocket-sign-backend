import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { OrdersModule } from 'src/orders/orders.module'
import { CaslModule } from 'src/casl/casl.module'
import { UsersService } from './users.service'
import { FilesModule } from 'src/files/files.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './user.entity'

@Module({
  imports: [
    OrdersModule,
    CaslModule,
    FilesModule,
    TypeOrmModule.forFeature([User]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
