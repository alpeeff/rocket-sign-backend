import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { GoogleOauthGuard } from './guards/google-oauth.guard'
import { AuthService } from './auth.service'
import { SignInUserDTO } from './dtos'

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
