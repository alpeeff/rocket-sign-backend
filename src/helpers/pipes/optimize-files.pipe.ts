import { PipeTransform } from '@nestjs/common'
import * as sharp from 'sharp'
import * as heicConvert from 'heic-convert'
import { FileDTO } from 'src/files/types'

export class OptimizeFilesPipe
  implements PipeTransform<Express.Multer.File[], Promise<FileDTO[]>>
{
  async transform(files: Express.Multer.File[]): Promise<FileDTO[]> {
    const images: FileDTO[] = (
      await Promise.all(
        files
          .filter((x) => x.mimetype.startsWith('image'))
          .map(async (file) => {
            if (file.mimetype.startsWith('video')) {
              return file.buffer
            }

            return optimizeImage(file)
          }),
      )
    ).map((x) => ({ buffer: x, contentType: 'image/webp' }))

    const videos: FileDTO[] = files
      .filter((x) => x.mimetype.startsWith('video'))
      .map((x) => ({ buffer: x.buffer, contentType: 'video/mp4' }))

    return [...videos, ...images]
  }
}

export class OptimizeImagePipe
  implements PipeTransform<Express.Multer.File, Promise<FileDTO>>
{
  async transform(file: Express.Multer.File): Promise<FileDTO> {
    return {
      buffer: await optimizeImage(file),
      contentType: 'image/webp',
    }
  }
}

async function optimizeImage(file: Express.Multer.File) {
  let preparedFile: Buffer = file.buffer

  if (file.mimetype === 'image/heic') {
    preparedFile = Buffer.from(
      await heicConvert({
        buffer: file.buffer,
        format: 'JPEG',
      }),
    )
  }

  return sharp(preparedFile)
    .resize(800)
    .webp({ effort: 3, quality: 80 })
    .toBuffer()
}
