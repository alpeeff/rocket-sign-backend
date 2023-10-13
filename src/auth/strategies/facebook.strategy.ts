import { Inject, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy, StrategyOptions } from 'passport-facebook'
import { VerifiedCallback } from 'passport-jwt'
import { ConfigService } from 'src/config/config.service'
import { SignInUserDTO } from '../dtos'

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(@Inject() configService: ConfigService) {
    super({
      clientID: configService.get('FACEBOOK_CLIENT_ID'),
      clientSecret: configService.get('FACEBOOK_CLIENT_SECRET'),
      callbackURL: configService.get('FACEBOOK_CALLBACK_URL'),
      profileFields: ['name', 'emails'],
      scope: 'email',
    } as StrategyOptions)
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifiedCallback,
  ) {
    const { emails } = profile

    const user: SignInUserDTO = {
      email: emails[0].value,
    }

    done(null, user)
  }
}
