import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, StrategyOptions } from 'passport-google-oauth2'
import { VerifiedCallback } from 'passport-jwt'
import { ConfigService } from 'src/config/config.service'
import { SignInUserDTO } from '../dtos'
import { Profile } from 'passport'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    } as StrategyOptions)
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifiedCallback,
  ) {
    const { name, emails } = profile

    const user: SignInUserDTO = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
    }

    done(null, user)
  }
}
