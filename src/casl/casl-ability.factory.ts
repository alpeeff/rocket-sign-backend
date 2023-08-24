import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
  createMongoAbility,
} from '@casl/ability'
import { Injectable } from '@nestjs/common'
import { Order, OrderState } from 'src/orders/order.entity'
import { Payment } from 'src/payments/payment.entity'
import { User, UserRole } from 'src/users/user.entity'

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',

  TakeInProgress = 'take-in-progress',
  ApproveFromCreator = 'approve-from-creator',
  ApproveFromExecutor = 'approve-from-executor',
  AttachFiles = 'attach-files',
}

type FlatOrder = Order & {
  'executor.id': Order['executor']['id']
  'user.id': Order['user']['id']
}

type Subjects = InferSubjects<typeof Order | typeof Payment> | 'all'
export type AppAbility = MongoAbility<[Action, Subjects]>

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

    switch (user.role) {
      case UserRole.Admin:
        can(Action.Manage, 'all')
        break

      case UserRole.Default:
        can(Action.Create, Order)

        can<FlatOrder>(Action.Read, Order, { 'user.id': user.id })

        can<FlatOrder>(Action.Update, Order, {
          'user.id': user.id,
          state: OrderState.Draft,
        })

        can<FlatOrder>(Action.ApproveFromCreator, Order, {
          'user.id': user.id,
          state: OrderState.WaitingForApproveFromCreator,
        })

        break

      case UserRole.Soldier:
        can<FlatOrder>(Action.Read, Order, { 'executor.id': user.id })
        can<FlatOrder>(Action.AttachFiles, Order, { 'executor.id': user.id })
        can<FlatOrder>(Action.TakeInProgress, Order, {
          executor: null,
          state: OrderState.WaitingForExecutor,
        })
        can<FlatOrder>(Action.ApproveFromExecutor, Order, {
          'executor.id': user.id,
          state: OrderState.InProgress,
        })
        break
    }

    return build({
      detectSubjectType: (object) =>
        object.constructor as ExtractSubjectType<Subjects>,
    })
  }
}
