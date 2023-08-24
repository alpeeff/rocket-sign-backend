import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { OrdersService } from 'src/orders/orders.service'

@Controller('users')
export class UsersController {
  constructor(private ordersService: OrdersService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getBalance(@Req() req: Request) {
    return await this.ordersService.getOrdersPaymentSumByUser(req.user)
  }
}
