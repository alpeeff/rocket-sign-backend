import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export enum UserRole {
  Default,
  Soldier,
  Admin,
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

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

  @Column({
    unique: true,
  })
  email: string
}
