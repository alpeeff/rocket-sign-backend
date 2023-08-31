import {
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { IOrder, Order } from './order.entity'
import { FileEntity } from 'src/files/file.entity'

@Entity()
export class OrderFile {
  @PrimaryGeneratedColumn()
  id: string

  @ManyToOne(() => Order, (order) => order.files)
  order: IOrder

  @OneToOne(() => FileEntity, (file) => file, { onDelete: 'CASCADE' })
  @JoinColumn()
  file: FileEntity
}
