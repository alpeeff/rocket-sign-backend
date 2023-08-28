import {
  BadGatewayException,
  Body,
  Controller,
  Post,
  UsePipes,
} from '@nestjs/common'
import { FondySignaturePipe } from './signature.pipe'
import { FondyCheckoutStatus } from 'src/types/fondy/types'
import { FondyCallbackRequestWithSignatureDTO } from './dtos'
import { PaymentsService } from '../payments.service'
import { PaymentState } from '../payment.entity'

@Controller('fondy')
export class FondyController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('/callback')
  @UsePipes(FondySignaturePipe)
  async callback(@Body() req: FondyCallbackRequestWithSignatureDTO) {
    if (req.order_status !== FondyCheckoutStatus.Approved) {
      return
    }

    const payment = await this.paymentsService.getByFondyId(req.order_id)

    if (!payment) {
      // Means that we received info about payment that doesn't exist in our system, add logs
      // TODO: Add Logs
      throw new BadGatewayException()
    }

    await this.paymentsService.updateState(payment, PaymentState.Frozen)
  }
}
