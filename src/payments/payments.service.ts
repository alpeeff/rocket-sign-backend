import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Payment, PaymentState } from './payment.entity'
import { Repository } from 'typeorm'
import { CreatePaymentDTO } from './dtos'

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
  ) {}

  async create({ amount, currency, externalId }: CreatePaymentDTO) {
    const payment = this.paymentRepository.create({
      amount,
      currency,
      usd_amount: amount,
      externalId,
    })

    try {
      return await this.paymentRepository.save(payment)
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async getById(id: string): Promise<Payment> {
    try {
      return await this.paymentRepository.findOneBy({ id })
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async getByFondyId(externalId: string) {
    try {
      return await this.paymentRepository.findOne({
        where: { externalId },
      })
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async changeState(paymentId: string, state: PaymentState) {
    try {
      await this.paymentRepository.update({ id: paymentId }, { state })
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }
}
