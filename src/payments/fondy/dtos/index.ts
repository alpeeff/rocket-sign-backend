import { IsString } from 'class-validator'
import { FondyCheckoutIntermediateSuccessResponseDTO } from 'cloudipsp-node-js-sdk'
import {
  FondyCheckoutStatus,
  FondyCheckoutVerificationStatus,
  FondyCurrency,
  FondyLang,
} from 'src/types/fondy/types'

export interface FondyCreateCheckoutDTO {
  amount: number
  currency: FondyCurrency
  lang: FondyLang
  desc: string
  email: string
}

export interface FondyCreateCheckoutResultDTO {
  orderId: string
  checkout: FondyCheckoutIntermediateSuccessResponseDTO
}

export interface FondyCreateCaptureDTO {
  orderId: string
  amount: number
  currency: FondyCurrency
}

export interface FondyCreateReverseDTO {
  orderId: string
  amount: number
  currency: FondyCurrency
}

export class FondyCheckoutResponseDTO {
  order_id: string
  merchant_id: number
  amount: number
  currency: FondyCurrency
  order_status: FondyCheckoutStatus
  response_status: string
  signature: string
  tran_type: 'purchase' | 'reverse'
  sender_cell_phone: string
  sender_account: string
  masked_card: string
  card_bin: number
  card_type: 'VISA' | 'MasterCard'
  rrn: string
  approval_code: string
  response_code: number
  response_description: string
  reversal_amount: number
  settlement_amount: number
  settlement_currency: FondyCurrency

  /**
   * @example 21.12.2014 11:21:30
   */
  order_time: string

  /**
   * @example 21.12.2014
   */
  settlement_date: string
  eci: number
  fee: number
  payment_system: 'card'
  sender_email: string
  payment_id: number
  actual_amount: number
  actual_currency: FondyCurrency
  product_id: string
  merchant_data: string
  verification_status: FondyCheckoutVerificationStatus
  rectoken: string

  /**
   * @example 01.01.2018 00:00:00
   */
  rectoken_lifetime: string
  additional_info: string
}

export class FondyCallbackRequestWithSignatureDTO extends FondyCheckoutResponseDTO {
  @IsString()
  signature: string
}

export interface FondyCallbackRequestSubscriptionDTO {
  data: string
  signature: string
}

export type FondyCallbackRequestDTO =
  | FondyCallbackRequestSubscriptionDTO
  | FondyCheckoutResponseDTO
