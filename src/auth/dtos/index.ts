import { IsString } from 'class-validator'

export interface RegisterNewUserDTO {
  email: string
}

export interface SignInUserDTO {
  email: string
}

export class VerifyGoogleIdTokenDTO {
  @IsString()
  idToken: string
}
