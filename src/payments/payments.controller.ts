import { Body, Controller, Post, Req, ValidationPipe } from '@nestjs/common'
import { FondyService } from './fondy/fondy.service'
import { FondyLang } from 'src/types/fondy/types'
import { Action } from 'src/casl/casl-ability.factory'
import { Payment } from './payment.entity'
import { Request } from 'express'
import { CreatePaymentDTO } from './dtos'
import { AuthGuard } from 'src/auth/guards/auth.guard'

@Controller('payments')
export class PaymentsController {
  constructor(private fondyService: FondyService) {}

  @Post()
  @AuthGuard((ability) => ability.can(Action.Create, Payment))
  async create(
    @Body(new ValidationPipe()) createPaymentDto: CreatePaymentDTO,
    @Req() req: Request,
  ) {
    const amount = createPaymentDto.amount * 100

    const checkout = await this.fondyService.createCheckout({
      amount,
      currency: createPaymentDto.currency,
      lang: FondyLang.UA,
      // TODO: Change description in Fondy checkout
      desc: 'Hello world',
      email: req.user.email,
    })

    return checkout
  }
}
