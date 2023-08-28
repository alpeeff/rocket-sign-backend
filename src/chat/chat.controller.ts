import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import { Order } from 'src/orders/order.entity'
import { OrderParam } from 'src/orders/orders.decorator'
import { CheckOrderPolicies, OrderExistsGuard } from 'src/orders/orders.guard'
import { ChatService } from './chat.service'
import { ReadMessageDTO, SendMessageDTO } from './dtos'
import { Action } from 'src/casl/casl-ability.factory'
import { Request } from 'express'
import { PaginationOptionsDTO } from 'src/pagination/pagination'

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('/:orderId')
  @CheckOrderPolicies(Action.SendReadMessage)
  @UseGuards(OrderExistsGuard)
  @AuthGuard()
  async sendMessage(
    @OrderParam() order: Order,
    @Body(new ValidationPipe()) sendMessageDto: SendMessageDTO,
    @Req() req: Request,
  ) {
    await this.chatService.send(req.user, order, sendMessageDto)
  }

  @Get('/:orderId')
  @CheckOrderPolicies(Action.SendReadMessage)
  @UseGuards(OrderExistsGuard)
  @AuthGuard()
  async getMessages(
    @OrderParam() order: Order,
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    options: PaginationOptionsDTO,
  ) {
    return await this.chatService.get({ orderId: order.id, ...options })
  }

  @Post('read/:orderId/:messageId')
  @CheckOrderPolicies(Action.SendReadMessage)
  @UseGuards(OrderExistsGuard)
  @AuthGuard()
  async readMessage(
    @Param(new ValidationPipe()) readMessageDto: ReadMessageDTO,
  ) {
    await this.chatService.setRead(readMessageDto)
  }
}
