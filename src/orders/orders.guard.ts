import { Action, CaslAbilityFactory } from 'src/casl/casl-ability.factory'
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  SetMetadata,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { FindOneOrderParams } from './dtos'
import { validate } from 'class-validator'
import { IUser } from 'src/users/user.entity'
import { Reflector } from '@nestjs/core'
import { IOrder } from './order.entity'
import { MAX_ORDER_FILES_LENGTH } from 'src/files/validations'

export const CHECK_ORDER_POLICIES_KEY = 'check_order_policy'
export const CheckOrderPolicies = (...actions: Action[]) => {
  return SetMetadata(CHECK_ORDER_POLICIES_KEY, actions)
}

export class OrderExistsGuard implements CanActivate {
  constructor(
    @Inject(OrdersService) private ordersService: OrdersService,
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext) {
    const actions =
      this.reflector.get<Action[]>(
        CHECK_ORDER_POLICIES_KEY,
        context.getHandler(),
      ) || []

    const request = context.switchToHttp().getRequest()
    const { params, user } = request

    const findOneOrderParams = new FindOneOrderParams()
    findOneOrderParams.orderId = params.orderId

    const errors = await validate(findOneOrderParams, {
      validationError: { target: false, value: false },
    })

    if (errors.length) {
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints)).flat(),
      )
    }

    const orderExists = await this.ordersService.orderExistsForUser(
      findOneOrderParams.orderId,
      user as IUser,
    )

    if (!orderExists) {
      throw new BadRequestException(`Order doesn't exist`)
    }

    const ability = this.caslAbilityFactory.createForUser(user as IUser)
    const result = actions.every((x) => ability.can(x, orderExists))

    if (result) {
      request.order = orderExists
    }

    return result
  }
}

export class OrderFileLengthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const { order }: { order: IOrder } = request

    if (order.files.length >= MAX_ORDER_FILES_LENGTH) {
      throw new BadRequestException(
        `You cannot upload more than ${MAX_ORDER_FILES_LENGTH} files`,
      )
    }

    return true
  }
}
