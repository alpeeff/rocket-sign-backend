import { TranslatablePaginationOptionsDTO } from 'src/pagination/pagination'
import { OrderState } from '../order.entity'
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'
import { TranslatableRequestDTO } from 'src/translations/dtos'

export class CreateNewOrderDTO extends TranslatableRequestDTO {
  @IsString()
  sign: string

  @IsInt()
  deliveryType: number

  @IsInt()
  reportType: number
}

export class TakeOrderInProgressDTO {
  @IsString()
  orderId: string
}

export class GetOrdersDTO extends TranslatablePaginationOptionsDTO {
  @IsEnum(OrderState)
  @IsOptional()
  state?: OrderState
}

export class FindOneOrderParams {
  @IsUUID()
  orderId: string
}

export class ApproveOrderDTO {
  @IsBoolean()
  publish: boolean
}
