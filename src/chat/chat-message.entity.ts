import { Order } from 'src/orders/order.entity'
import { IUser, User } from 'src/users/user.entity'
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 500 })
  message: string

  @ManyToOne(() => User)
  sender: IUser

  @ManyToOne(() => User)
  receiver: IUser

  @CreateDateColumn({ type: 'timestamp' })
  date: number

  @ManyToOne(() => Order)
  order: Order

  @Column({ default: false })
  read: boolean
}
