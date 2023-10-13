import { BadRequestException, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, StrategyOptions } from 'passport-google-oauth2'
import { VerifiedCallback } from 'passport-jwt'
import { ConfigService } from 'src/config/config.service'
import { SignInUserDTO } from '../dtos'
import { Profile } from 'passport'
import { auth } from '@googleapis/oauth2'

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

  async verifyIdToken(idToken: string): Promise<string> {
    const client = new auth.OAuth2({
      clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET'),
    })

    try {
      const response = await client.verifyIdToken({ idToken })
      return response.getAttributes().payload.email
    } catch (e) {
      throw new BadRequestException(e.message)
    }
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
