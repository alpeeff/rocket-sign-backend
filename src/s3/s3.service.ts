import { Injectable } from '@nestjs/common'
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { ConfigService } from 'src/config/config.service'
import { FilesContentType, FileDTO } from 'src/files/types'

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client
  private readonly bucketName: string

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_S3_SECRET_ACCESS_KEY'),
      },
    })

    this.bucketName = this.configService.get('AWS_S3_ORDERS_BUCKET')
  }

  async upload(fileName: string, file: Buffer, contentType: FilesContentType) {
    return await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file,
        ContentType: contentType,
      }),
    )
  }

  async get(key: string) {
    return await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    )
  }

  async getFile(key: string): Promise<FileDTO> {
    const { Body, ContentType } = await this.get(key)

    const byteArray = await Body.transformToByteArray()

    return {
      buffer: Buffer.from(byteArray),
      contentType: ContentType as FilesContentType,
    }
  }

  async delete(key: string | string[]) {
    return await this.s3Client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: Array.isArray(key)
            ? key.map((x) => ({ Key: x }))
            : [{ Key: key }],
        },
      }),
    )
  }
}
