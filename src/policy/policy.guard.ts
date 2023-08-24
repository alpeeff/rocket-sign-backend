import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AppAbility, CaslAbilityFactory } from 'src/casl/casl-ability.factory'
import { User } from 'src/users/user.entity'

export interface IPolicyHandler {
  handle(ability: AppAbility): boolean
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback

export const CHECK_POLICIES_KEY = 'check_policy'
export const CheckPolicies = (...handlers: PolicyHandler[]) => {
  return SetMetadata(CHECK_POLICIES_KEY, handlers)
}

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || []

    const { user } = context.switchToHttp().getRequest()
    const ability = this.caslAbilityFactory.createForUser(user as User)

    const result = policyHandlers.every((handler) => {
      return this.execPolicyHandler(handler, ability)
    })

    return result
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability)
    }

    return handler.handle(ability)
  }
}
