import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FileEntity } from './file.entity'
import { Repository } from 'typeorm'
import { S3Service } from 'src/s3/s3.service'
import { FilesContentType, FileDTO } from './types'
import { Order } from 'src/orders/order.entity'
import { GetFileDTO } from './dtos'

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private filesRepository: Repository<FileEntity>,
    private s3Service: S3Service,
  ) {}

  async upload(
    order: Order,
    fileName: string,
    buffer: Buffer,
    contentType: FilesContentType,
  ) {
    const key = `${order.id}_${fileName}`

    const fileEntity = new FileEntity()
    fileEntity.order = order
    fileEntity.externalKey = key

    await this.filesRepository.save(fileEntity)
    await this.s3Service.upload(fileEntity.externalKey, buffer, contentType)
  }

  async get(id: string): Promise<FileDTO> {
    const fileExists = await this.filesRepository.findOneBy({ id })
    return await this.s3Service.getFile(fileExists.externalKey)
  }

  async fileExists(getFileDto: GetFileDTO) {
    const fileExists = await this.filesRepository.findOne({
      where: { id: getFileDto.fileId },
      relations: { order: true },
    })

    return fileExists
  }
}
