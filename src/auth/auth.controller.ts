import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common'
import { GoogleOauthGuard } from './guards/google-oauth.guard'
import { AuthService } from './auth.service'
import { SignInUserDTO, VerifyGoogleIdTokenDTO } from './dtos'
import { GoogleStrategy } from './strategies/google.strategy'

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleStrategy: GoogleStrategy,
  ) {}

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async auth() {}

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(@Req() req: { user: SignInUserDTO | undefined }) {
    const token = await this.authService.signIn(req.user)

    return { token }
  }

  @Post('google/verify-token-id')
  @HttpCode(200)
  async verifyTokenId(
    @Body(new ValidationPipe()) verifyGoogleIdTokenDto: VerifyGoogleIdTokenDTO,
  ) {
    const email = await this.googleStrategy.verifyIdToken(
      verifyGoogleIdTokenDto.idToken,
    )

    const user = await this.authService.findUserByEmail(email)

    let token: string

    if (user) {
      token = await this.authService.signIn({ email })
    } else {
      token = await this.authService.registerNewUser({ email })
    }

    return { token }
  }
}
