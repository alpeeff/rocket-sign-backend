import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Payment, PaymentState } from './payment.entity'
import { Repository } from 'typeorm'
import { CreatePaymentDTO } from './dtos'

// TODO: Change to API data
const USD_CURRENCY = 36.94

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
  ) {}

  async create({ amount, currency, externalId }: CreatePaymentDTO) {
    const payment = this.paymentRepository.create({
      amount,
      currency,
      usdAmount: amount * USD_CURRENCY,
      externalId,
    })

    try {
      return await this.paymentRepository.save(payment)
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async paymentExists(id: string): Promise<Payment> {
    return await this.paymentRepository.findOneBy({ id })
  }

  async getByFondyId(externalId: string) {
    return await this.paymentRepository.findOneBy({ externalId })
  }

  async updateState(payment: Payment, state: PaymentState) {
    await this.paymentRepository.update(payment, { state })
  }
}
