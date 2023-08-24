import { UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { InjectRepository } from '@nestjs/typeorm'
import { Strategy, StrategyOptions } from 'passport-jwt'
import { ConfigService } from 'src/config/config.service'
import { User } from 'src/users/user.entity'
import { Repository } from 'typeorm'

export type JwtPayload = {
  sub: string
  email: string
}

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    super({
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: (req) => req.headers.authorization,
    } as StrategyOptions)
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { email: payload.email },
    })

    if (!user) {
      throw new UnauthorizedException()
    }

    return user
  }
}
