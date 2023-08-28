import { FondyCheckoutIntermediateSuccessResponseDTO } from 'cloudipsp-node-js-sdk'
import { FondyCurrency, FondyLang } from 'src/types/fondy/types'

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
}
