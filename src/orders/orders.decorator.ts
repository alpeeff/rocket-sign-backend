import { ExecutionContext, createParamDecorator } from '@nestjs/common'

export const OrderParam = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.order
  },
)
