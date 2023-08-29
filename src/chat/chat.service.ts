import { Injectable, NotFoundException } from '@nestjs/common'
import { Pagination } from 'src/pagination/pagination'
import { ChatMessage } from './chat-message.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { GetChatMessagesDTO, ReadMessageDTO, SendMessageDTO } from './dtos'
import { IOrder } from 'src/orders/order.entity'
import { IUser } from 'src/users/user.entity'

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async send(user: IUser, order: IOrder, sendMessageDto: SendMessageDTO) {
    const receiver = order.user.id === user.id ? order.executor : order.user

    const message = this.chatMessageRepository.create({
      message: sendMessageDto.message,
      order,
      sender: user,
      receiver,
    })

    await this.chatMessageRepository.save(message)
  }

  async get(options: GetChatMessagesDTO): Promise<Pagination<ChatMessage>> {
    const [results, count] = await this.chatMessageRepository.findAndCount({
      where: { order: { id: options.orderId } },
      order: { date: { direction: 'DESC' } },
      relations: { sender: true, receiver: true },
      take: options.limit,
      skip: options.page * options.limit,
    })

    return new Pagination({
      results,
      total: count,
    })
  }

  async setRead(readMessageDto: ReadMessageDTO) {
    const messageExists = await this.messageExists(readMessageDto.messageId)

    if (!messageExists) {
      throw new NotFoundException(`Message doesn't exist`)
    }

    await this.chatMessageRepository.update(
      { id: messageExists.id },
      { read: true },
    )
  }

  async messageExists(messageId: string) {
    return await this.chatMessageRepository.findOneBy({
      id: messageId,
    })
  }
}
