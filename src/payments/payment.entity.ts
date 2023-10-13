import { FondyCurrency } from 'src/types/fondy/types'
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm'

export enum PaymentCurrency {
  USD = 'usd',
  UAH = 'uah',
}

/**
 * - WaitingForPaymentSystem - payment is waiting for fondy approve
 * - Frozen - pre-auth operation is completed, amount is frozen
 * - OnPaymentSystemAccount - capture operation is completed so amount is on fondy account
 * - Paid - accountant paid soldier for order
 * - Reversed - soldier cancelled order execution
 */
export enum PaymentState {
  WaitingForPaymentSystem,
  Frozen,
  OnPaymentSystemAccount,
  Paid,
  Reversed,
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: number

  @Column({ type: 'float' })
  amount: number

  @Column({
    enum: FondyCurrency,
  })
  currency: FondyCurrency

  @Column({
    enum: PaymentState,
    default: PaymentState.WaitingForPaymentSystem,
  })
  state: PaymentState

  @Column({ name: 'external_id' })
  externalId: string
}
