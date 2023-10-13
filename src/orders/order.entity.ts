import { Exclude, instanceToPlain } from 'class-transformer'
import {
  DeliveryType,
  TranslatedDeliveryType,
} from 'src/delivery-type/delivery-type.entity'
import { Payment } from 'src/payments/payment.entity'
import {
  ReportType,
  TranslatedReportType,
} from 'src/report-type/report-type.entity'
import { IUser, User } from 'src/users/user.entity'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { OrderFile } from './order-file.entity'

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
  reportType: ReportType
  deliveryType: DeliveryType
  sign: string
  deliveryTypePrice: number
  reportTypePrice: number
  payment: Payment
  files: OrderFile[]
  published: boolean
  createdAt: Date
  completedAt: Date
}

export interface TranslatedOrder
  extends Omit<IOrder, 'reportType' | 'deliveryType'> {
  reportType: TranslatedReportType
  deliveryType: TranslatedDeliveryType
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

  @ManyToOne(() => ReportType, (reportType) => reportType)
  reportType: ReportType

  @ManyToOne(() => DeliveryType, (deliveryType) => deliveryType)
  deliveryType: DeliveryType

  @Column()
  sign: string

  @OneToOne(() => Payment)
  @JoinColumn()
  payment: Payment

  @OneToMany(() => OrderFile, (orderFile) => orderFile.order)
  files: OrderFile[]

  @Exclude()
  @Column({ default: false })
  published: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date

  @Column()
  deliveryTypePrice: number

  @Column()
  reportTypePrice: number

  toJSON() {
    return instanceToPlain(this)
  }
}
