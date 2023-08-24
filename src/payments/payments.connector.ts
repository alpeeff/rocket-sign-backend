import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { FondyService } from './fondy/fondy.service'
import { Payment, PaymentState } from './payment.entity'
import { CreatePaymentsConnectorPaymentDTO } from './dtos'
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
  }: CreatePaymentsConnectorPaymentDTO): Promise<Payment> {
    const amount = createPaymentDto.amount * 100

    const fondyCheckout = await this.fondyService.createCheckout({
      amount,
      currency,
      desc,
      email,
      lang: FondyLang.UA,
    })

    const localPayment = await this.paymentsService.create({
      amount,
      currency,
      externalId: fondyCheckout.orderId,
    })

    return localPayment
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
