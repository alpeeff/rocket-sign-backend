import { Injectable, InternalServerErrorException } from '@nestjs/common'
import * as CloudIpsp from 'cloudipsp-node-js-sdk'
import { ConfigService } from 'src/config/config.service'
import { FondyFlag } from 'src/types/fondy/types'
import { generateSignature } from './utils'
import {
  FondyCreateCaptureDTO,
  FondyCreateCheckoutDTO,
  FondyCreateCheckoutResultDTO,
  FondyCreateReverseDTO,
} from './dtos'

/**
 * 1. At first we create checkout using {createCheckout} method
 *
 * - After checkout there are 2 possible ways: Capture/Checkout
 *
 * - If we Capture, we put held money from payer's account to Fondy system.
 *
 * - If we Reverse, we put held money back to payer's account
 *
 */
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
  }: FondyCreateCheckoutDTO): Promise<FondyCreateCheckoutResultDTO> {
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
        checkout,
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
      throw new InternalServerErrorException()
    }
  }

  async createReverse({ amount, currency, orderId }: FondyCreateReverseDTO) {
    try {
      return await this.fondy.Reverse({
        amount,
        currency,
        order_id: orderId,
        merchant_id: this.merchantId,
        version: '1.0.1',
      })
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async getOrderStatus(orderId: string) {
    try {
      return await this.fondy.Status({
        merchant_id: this.merchantId,
        version: '1.0',
        order_id: orderId,
      })
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }
}
