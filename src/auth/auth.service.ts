import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from 'src/users/user.entity'
import { Repository } from 'typeorm'
import { RegisterNewUserDTO, SignInUserDTO } from './dtos'
import { generateFromEmail } from 'unique-username-generator'
import { JwtPayload } from './strategies/jwt.strategy'

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  generateJwt(payload: JwtPayload) {
    return this.jwtService.sign(payload)
  }

  async signIn(user: SignInUserDTO | undefined) {
    if (!user) {
      throw new BadRequestException('Unauthenticated')
    }

    const userExists = await this.findUserByEmail(user.email)

    let jwt: string

    if (!userExists) {
      jwt = await this.registerNewUser({ email: user.email })
      return
    }

    jwt = this.generateJwt({
      sub: userExists.id,
      email: userExists.email,
    })

    return jwt
  }

  async registerNewUser(user: RegisterNewUserDTO) {
    try {
      const newUser = this.userRepository.create({
        email: user.email,
      })

      newUser.username = generateFromEmail(newUser.email, 5)

      await this.userRepository.save(newUser)

      return this.generateJwt({
        sub: newUser.id,
        email: newUser.email,
      })
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } })

    if (!user) {
      return null
    }

    return user
  }
}
