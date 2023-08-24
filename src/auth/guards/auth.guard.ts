import { UseGuards, applyDecorators } from '@nestjs/common'
import {
  CheckPolicies,
  PoliciesGuard,
  PolicyHandler,
} from 'src/policy/policy.guard'
import { JwtAuthGuard } from './jwt-auth.guard'

export function AuthGuard(...policyHandler: PolicyHandler[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    CheckPolicies(...policyHandler),
    UseGuards(PoliciesGuard),
  )
}
