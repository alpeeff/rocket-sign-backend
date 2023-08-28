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
 * - Waiting - payment is waiting for fondy approve
 * - Held - pre-auth operation is completed, amount is frozen
 * - InSystem - capture operation is completed so amount is on fondy account
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

  @Column({ name: 'usd_amount', type: 'float' })
  usdAmount: number

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
