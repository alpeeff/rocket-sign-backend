import { BadRequestException, Injectable, StreamableFile } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FileEntity } from './file.entity'
import { Repository } from 'typeorm'
import { S3Service } from 'src/s3/s3.service'

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private filesRepository: Repository<FileEntity>,
    private s3Service: S3Service,
  ) {}

  async upload(fileName: string, orderId: string, buffer: Buffer) {
    const key = `${orderId}_${fileName}`

    const fileEntity = new FileEntity()
    fileEntity.orderId = orderId
    fileEntity.externalKey = key

    await this.s3Service.upload(fileEntity.externalKey, buffer)
    await this.filesRepository.save(fileEntity)
  }

  async get(id: string) {
    const fileExists = await this.filesRepository.findOne({ where: { id } })

    if (!fileExists) {
      throw new BadRequestException()
    }

    const s3FileBuffer = await this.s3Service.getBuffer(fileExists.externalKey)

    return new StreamableFile(s3FileBuffer)
  }
}
