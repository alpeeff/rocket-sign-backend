import { User } from 'src/users/user.entity'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer'
import 'jest'

declare module 'express-serve-static-core' {
  interface Request {
    user: User
  }
}
