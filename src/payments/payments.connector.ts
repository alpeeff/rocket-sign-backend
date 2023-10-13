import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { FondyService } from './fondy/fondy.service'
import { Payment, PaymentState } from './payment.entity'
import {
  CreatePaymentResultDTO,
  CreatePaymentsConnectorPaymentDTO,
} from './dtos'
import { FondyLang } from 'src/types/fondy/types'

@Injectable()
export class PaymentsConnector {
  constructor(
    private paymentsService: PaymentsService,
    private fondyService: FondyService,
  ) {}

  async create({
    currency,
    desc,
    email,
    ...createPaymentDto
  }: CreatePaymentsConnectorPaymentDTO): Promise<CreatePaymentResultDTO> {
    const amount = createPaymentDto.amount * 100

    const checkout = await this.fondyService.createCheckout({
      amount,
      currency,
      desc,
      email,
      lang: FondyLang.UA,
    })

    const payment = await this.paymentsService.create({
      amount,
      currency,
      externalId: checkout.orderId,
    })

    return {
      checkout,
      payment,
    }
  }

  async capture(payment: Payment) {
    try {
      const capture = await this.fondyService.createCapture({
        amount: payment.amount,
        currency: payment.currency,
        orderId: payment.externalId,
      })

      if (
        capture.response_status === 'success' &&
        capture.capture_status === 'captured'
      ) {
        await this.paymentsService.updateState(
          payment,
          PaymentState.OnPaymentSystemAccount,
        )
      }
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async reverse(payment: Payment) {
    try {
      const capture = await this.fondyService.createReverse({
        amount: payment.amount,
        currency: payment.currency,
        orderId: payment.externalId,
      })

      if (
        capture.response_status === 'success' &&
        capture.reverse_status === 'approved'
      ) {
        await this.paymentsService.updateState(payment, PaymentState.Reversed)
      }
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }
}
