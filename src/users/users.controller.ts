import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Request } from 'express'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import { OrdersService } from 'src/orders/orders.service'
import { UserAvatarParam } from './users.decorator'
import { FileDTO } from 'src/files/types'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(
    private ordersService: OrdersService,
    private usersService: UsersService,
  ) {}

  @Get('balance')
  @AuthGuard()
  async getBalance(@Req() req: Request) {
    return await this.ordersService.getOrdersPaymentSumByUser(req.user)
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @AuthGuard()
  async setAvatar(@UserAvatarParam() avatar: FileDTO, @Req() req: Request) {
    await this.usersService.setAvatar(req.user, avatar)
  }

  @Delete('avatar')
  @AuthGuard()
  async deleteAvatar(@Req() req: Request) {
    if (!req.user.avatarId) {
      throw new BadRequestException('Avatar not set')
    }

    await this.usersService.deleteAvatar(req.user)
  }
}
