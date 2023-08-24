import { Injectable, InternalServerErrorException } from '@nestjs/common'
import * as CloudIpsp from 'cloudipsp-node-js-sdk'
import { ConfigService } from 'src/config/config.service'
import { FondyCurrency, FondyFlag } from 'src/types/fondy/types'
import { generateSignature } from './utils'
import {
  FondyCreateCaptureDTO,
  FondyCreateCheckoutDTO,
  FondyCreateReverseDTO,
} from './dtos'

@Injectable()
export class FondyService {
  fondy: CloudIpsp
  merchantId: number

  constructor(private configService: ConfigService) {
    this.merchantId = configService.getNumber('FONDY_MERCHANT_ID')

    this.fondy = new CloudIpsp({
      merchantId: this.merchantId,
      secretKey: configService.get('FONDY_SECRET_KEY'),
    })
  }

  async createCheckout({
    amount,
    currency,
    lang,
    desc,
    email,
  }: FondyCreateCheckoutDTO) {
    const orderId = this.fondy.getOrderId()
    const signature = generateSignature(
      this.configService.get('FONDY_SECRET_KEY'),
      orderId,
      amount,
      currency,
      desc,
    )

    try {
      const checkout = await this.fondy.Checkout({
        amount,
        currency,
        signature,
        lang,
        order_id: orderId,
        order_desc: desc,
        merchant_id: this.merchantId,
        version: '1.0.1',
        preauth: FondyFlag.YES,
        sender_email: email,
      })

      return {
        ...checkout,
        orderId,
      }
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async createCapture({ amount, currency, orderId }: FondyCreateCaptureDTO) {
    try {
      return await this.fondy.Capture({
        amount,
        currency,
        order_id: orderId,
        merchant_id: this.merchantId,
        version: '1.0',
      })
    } catch (e) {
      console.log(e)
      throw new InternalServerErrorException()
    }
  }

  async createReverse({ orderId }: FondyCreateReverseDTO) {
    // TODO: get transfer info from fondy/local db
    const amount = 1
    const currency = FondyCurrency.UAH

    try {
      return await this.fondy.Reverse({
        amount,
        currency,
        order_id: orderId,
        merchant_id: this.merchantId,
        version: '1.0.1',
      })
    } catch (e) {
      console.log(e)
      throw new InternalServerErrorException()
    }
  }

  async getOrderStatus() {
    try {
      return await this.fondy.Status({
        merchant_id: this.merchantId,
        version: '1.0',
        order_id: '1396424_6SaqXPUtFjF9P4rYQDE5PdYkHRCRFdxwO6FVFqwy',
      })
    } catch (e) {
      console.log(e)
      throw new InternalServerErrorException()
    }
  }
}
