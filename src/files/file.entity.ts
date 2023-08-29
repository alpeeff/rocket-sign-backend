import { IUser, User } from 'src/users/user.entity'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToMany(() => User)
  @JoinTable()
  owners: IUser[]

  @Column()
  externalKey: string

  @Column({ default: false })
  published: boolean
}
