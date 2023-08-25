import { ExecutionContext, createParamDecorator } from '@nestjs/common'

export const FileParam = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.file
  },
)
