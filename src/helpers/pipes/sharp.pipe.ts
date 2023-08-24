import { PipeTransform } from '@nestjs/common'
import * as sharp from 'sharp'
import * as heicConvert from 'heic-convert'

export class SharpPipe
  implements PipeTransform<Express.Multer.File[], Promise<Buffer[]>>
{
  async transform(images: Express.Multer.File[]): Promise<Buffer[]> {
    return await Promise.all(
      images.map(async (image) => {
        let preparedImage: ArrayBuffer = image.buffer

        if (image.mimetype === 'image/heic') {
          preparedImage = await heicConvert({
            buffer: image.buffer,
            format: 'JPEG',
          })
        }

        return sharp(preparedImage)
          .resize(800)
          .webp({
            effort: 3,
          })
          .toBuffer()
      }),
    )
  }
}
