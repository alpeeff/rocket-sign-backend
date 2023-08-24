import { DeliveryType } from 'src/delivery-type/delivery-type.entity'
import { FileEntity } from 'src/files/file.entity'
import { Payment } from 'src/payments/payment.entity'
import { ReportType } from 'src/report-type/report-type.entity'
import { User } from 'src/users/user.entity'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
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
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User)
  user: User

  @ManyToOne(() => User, { nullable: true })
  executor: User

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

  @OneToMany(() => FileEntity, (file) => file.orderId)
  files: string[]

  @Column()
  published: boolean
}
