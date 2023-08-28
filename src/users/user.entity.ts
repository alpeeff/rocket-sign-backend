import { Exclude, instanceToPlain } from 'class-transformer'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export enum UserRole {
  Default,
  Soldier,
  Admin,
}

export interface IUser {
  id: string
  role: UserRole
  username: string
  email: string
  avatarId: string | null
}

@Entity()
export class User implements IUser {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Exclude()
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.Default,
  })
  role: UserRole

  @Column({
    unique: true,
  })
  username: string

  @Exclude()
  @Column({
    unique: true,
  })
  email: string

  @Column({ nullable: true })
  avatarId: string | null

  toJSON() {
    return instanceToPlain(this)
  }
}
