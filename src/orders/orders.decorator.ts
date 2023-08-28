import {
  ExecutionContext,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFiles,
  createParamDecorator,
} from '@nestjs/common'
import { MAX_FILE_SIZE } from 'src/files/validations'
import { OptimizeFilesPipe } from 'src/helpers/pipes/optimize-files.pipe'

export const OrderParam = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.order
  },
)

export const OrderFilesParam = () => {
  return UploadedFiles(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
        new FileTypeValidator({
          fileType: /(jpg|jpeg|png|heic|mp4)$/,
        }),
      ],
    }),
    new OptimizeFilesPipe(),
  )
}
