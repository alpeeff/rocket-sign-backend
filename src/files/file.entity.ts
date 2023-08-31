import { Exclude } from 'class-transformer'
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

  @Exclude()
  @ManyToMany(() => User)
  @JoinTable()
  owners: IUser[]

  @Exclude()
  @Column({ name: 'external_key' })
  externalKey: string

  @Exclude()
  @Column({ default: false })
  published: boolean
}
