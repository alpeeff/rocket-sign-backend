import { Exclude, instanceToPlain } from 'class-transformer'
import { DeliveryType } from 'src/delivery-type/delivery-type.entity'
import { Payment } from 'src/payments/payment.entity'
import { ReportType } from 'src/report-type/report-type.entity'
import { IUser, User } from 'src/users/user.entity'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

export enum OrderState {
  Draft,
  InModeration,
  WaitingForExecutor,
  InProgress,
  WaitingForApproveFromCreator,
  Done,
  CancelledByModerator,
  CancelledByExecutor,
  Appeal,
}

export interface IOrder {
  id: string
  user: IUser
  executor: IUser
  state: OrderState
  reportType: number
  sign: string
  deliveryType: number
  payment: Payment
  files: string[]
  published: boolean
}

@Entity()
export class Order implements IOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User)
  user: IUser

  @ManyToOne(() => User, { nullable: true })
  executor: IUser

  @Column({
    type: 'enum',
    enum: OrderState,
  })
  state: OrderState

  @ManyToOne(() => ReportType, (reportType) => reportType.id)
  reportType: number

  @Column()
  sign: string

  @ManyToOne(() => DeliveryType, (deliveryType) => deliveryType.id)
  deliveryType: number

  @OneToOne(() => Payment)
  @JoinColumn()
  payment: Payment

  @Column('text', { array: true, default: [] })
  files: string[]

  @Exclude()
  @Column({ default: false })
  published: boolean

  toJSON() {
    if (
      ![OrderState.Done, OrderState.WaitingForApproveFromCreator].includes(
        this.state,
      )
    ) {
      this.files = undefined
    }

    return instanceToPlain(this)
  }
}
