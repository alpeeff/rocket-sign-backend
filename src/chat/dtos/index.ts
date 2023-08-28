import { IsUUID, MaxLength, MinLength } from 'class-validator'
import { PaginationOptionsDTO } from 'src/pagination/pagination'

export class GetChatMessagesDTO extends PaginationOptionsDTO {
  @IsUUID()
  orderId: string
}

export class SendMessageDTO {
  @MaxLength(500)
  @MinLength(5)
  message: string
}

export class ReadMessageDTO {
  @IsUUID()
  messageId: string
}
