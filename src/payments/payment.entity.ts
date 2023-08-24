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

export enum PaymentState {
  Waiting,
  Held,
  InSystem,
  Paid,
  Reversed,
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: number

  @Column({ type: 'float' })
  usd_amount: number

  @Column({ type: 'float' })
  amount: number

  @Column({
    enum: FondyCurrency,
  })
  currency: FondyCurrency

  @Column({
    enum: PaymentState,
    default: PaymentState.Waiting,
  })
  state: PaymentState

  @Column({
    nullable: true,
  })
  externalId: string
}
