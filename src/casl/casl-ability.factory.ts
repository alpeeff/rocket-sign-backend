import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
  createMongoAbility,
} from '@casl/ability'
import { Injectable } from '@nestjs/common'
import { ChatMessage } from 'src/chat/chat-message.entity'
import { FileEntity } from 'src/files/file.entity'
import { Order, OrderState } from 'src/orders/order.entity'
import { Payment } from 'src/payments/payment.entity'
import { IUser, UserRole } from 'src/users/user.entity'

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
  SendReadMessage = 'send-message',
  CancelExecution = 'cancel-execution',
  AppealOrder = 'appeal-order',
}

type FlatOrder = Order & {
  'executor.id': Order['executor']['id']
  'user.id': Order['user']['id']
}

type FlatFile = FileEntity & {
  'owners.id': FileEntity['owners'][number]['id']
}

type Subjects =
  | InferSubjects<
      typeof Order | typeof Payment | typeof FileEntity | typeof ChatMessage
    >
  | 'all'

export type AppAbility = MongoAbility<[Action, Subjects]>

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: IUser) {
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

        can<FlatOrder>(Action.CancelExecution, Order, {
          'user.id': user.id,
          state: {
            $in: [OrderState.WaitingForExecutor, OrderState.InModeration],
          },
        })

        can<FlatOrder>(Action.AppealOrder, Order, {
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

        can<FlatOrder>(Action.CancelExecution, Order, {
          'executor.id': user.id,
          state: {
            $in: [OrderState.InProgress],
          },
        })

        break
    }

    can(Action.Read, Order, { published: true })

    can<FlatFile>(Action.Read, FileEntity, { 'owners.id': user.id })

    can<FlatOrder>(Action.SendReadMessage, Order, {
      'user.id': user.id,
      state: {
        $in: [OrderState.Appeal],
      },
    })

    can<FlatOrder>(Action.SendReadMessage, Order, {
      'executor.id': user.id,
      state: OrderState.Appeal,
    })

    return build({
      detectSubjectType: (object) =>
        object.constructor as ExtractSubjectType<Subjects>,
    })
  }
}
