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
import { User } from 'src/users/user.entity'
import { Reflector } from '@nestjs/core'

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
      user as User,
    )

    if (!orderExists) {
      throw new BadRequestException(`Order doesn't exist`)
    }

    const ability = this.caslAbilityFactory.createForUser(user as User)
    const result = actions.every((x) => ability.can(x, orderExists))

    if (result) {
      request.order = orderExists
    }

    return result
  }
}
