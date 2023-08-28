import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { FondyCurrency } from 'src/types/fondy/types'
import { FondyCreateCheckoutResultDTO } from '../fondy/dtos'
import { Payment } from '../payment.entity'

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

export interface CreatePaymentResultDTO {
  checkout: FondyCreateCheckoutResultDTO
  payment: Payment
}
