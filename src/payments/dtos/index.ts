import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { FondyCurrency } from 'src/types/fondy/types'

export class CreatePaymentDTO {
  @IsNumber()
  amount: number

  @IsEnum(FondyCurrency)
  currency: FondyCurrency

  @IsString()
  @IsOptional()
  externalId?: string
}

export class CreateReverseDTO {
  @IsString()
  orderId: string
}

export interface CreatePaymentsConnectorPaymentDTO {
  amount: number
  currency: FondyCurrency
  email: string
  desc: string
}
