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
      await this.fondyService.createCapture({
        amount: payment.usd_amount,
        currency: payment.currency,
        orderId: payment.externalId,
      })

      await this.paymentsService.changeState(payment.id, PaymentState.InSystem)
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }
}
