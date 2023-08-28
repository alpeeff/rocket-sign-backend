import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FileEntity } from './file.entity'
import { Repository } from 'typeorm'
import { S3Service } from 'src/s3/s3.service'
import { FilesContentType, FileDTO } from './types'
import { GetFileDTO } from './dtos'
import { IUser } from 'src/users/user.entity'

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private filesRepository: Repository<FileEntity>,
    private s3Service: S3Service,
  ) {}

  async upload(
    user: IUser,
    fileName: string,
    buffer: Buffer,
    contentType: FilesContentType,
  ) {
    const key = `${user.id}_${fileName}`

    const fileEntity = new FileEntity()
    fileEntity.user = user
    fileEntity.externalKey = key

    const { id } = await this.filesRepository.save(fileEntity)
    await this.s3Service.upload(fileEntity.externalKey, buffer, contentType)

    return id
  }

  async get(fileId: string): Promise<FileDTO> {
    const fileExists = await this.fileExists({ fileId })
    return await this.s3Service.getFile(fileExists.externalKey)
  }

  async delete(fileId: string) {
    const fileExists = await this.fileExists({ fileId })

    if (!fileExists) {
      throw new NotFoundException(`File doesn't exist`)
    }

    await this.s3Service.delete(fileExists.externalKey)
    await this.filesRepository.remove(fileExists)
  }

  async fileExists(getFileDto: GetFileDTO) {
    const fileExists = await this.filesRepository.findOne({
      where: { id: getFileDto.fileId },
      relations: { user: true },
    })

    return fileExists
  }
}
