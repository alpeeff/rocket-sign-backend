import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFile,
} from '@nestjs/common'
import { MAX_FILE_SIZE } from 'src/files/validations'
import { OptimizeImagePipe } from 'src/helpers/pipes/optimize-files.pipe'

export const UserAvatarParam = () => {
  return UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
        new FileTypeValidator({
          fileType: /(jpg|jpeg|png|heic)$/,
        }),
      ],
    }),
    new OptimizeImagePipe(),
  )
}
