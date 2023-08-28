import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatMessage } from './chat-message.entity'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { CaslModule } from 'src/casl/casl.module'
import { OrdersModule } from 'src/orders/orders.module'

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage]), CaslModule, OrdersModule],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
