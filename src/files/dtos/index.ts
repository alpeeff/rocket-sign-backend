import { IsUUID } from 'class-validator'

export class GetFileDTO {
  @IsUUID()
  fileId: string
}
