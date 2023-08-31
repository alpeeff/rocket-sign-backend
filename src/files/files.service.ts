import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FileEntity } from './file.entity'
import { In, Repository } from 'typeorm'
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
    fileEntity.owners = [user]
    fileEntity.externalKey = key

    const file = await this.filesRepository.save(fileEntity)
    await this.s3Service.upload(fileEntity.externalKey, buffer, contentType)

    return file
  }

  async getStorageFile(fileId: string): Promise<FileDTO> {
    const fileExists = await this.fileExists({ fileId })
    return await this.s3Service.getFile(fileExists.externalKey)
  }

  async get(filesIds: string[]) {
    return await this.filesRepository.find({
      where: { id: In(filesIds) },
      relations: { owners: true },
    })
  }

  async delete(fileId: string) {
    const fileExists = await this.fileExists({ fileId })

    if (!fileExists) {
      throw new NotFoundException(`File doesn't exist`)
    }

    await this.s3Service.delete(fileExists.externalKey)
    await this.filesRepository.remove(fileExists)
  }

  async addOwner(files: FileEntity[], newOwner: IUser) {
    await Promise.all(
      files.map((file) =>
        this.filesRepository.save({
          id: file.id,
          owners: file.owners.concat(newOwner),
        }),
      ),
    )
  }

  async removeOwner(files: FileEntity[], oldOwner: IUser) {
    await Promise.all(
      files.map((file) =>
        this.filesRepository.update(
          { id: file.id },
          { owners: file.owners.filter((x) => x.id !== oldOwner.id) },
        ),
      ),
    )
  }

  async publish(files: FileEntity[]) {
    await Promise.all(
      files.map((file) => this.changePublishedStateOnFile(file.id, true)),
    )
  }

  async unpublish(files: FileEntity[]) {
    await Promise.all(
      files.map((file) => this.changePublishedStateOnFile(file.id, false)),
    )
  }

  async changePublishedStateOnFile(fileId: string, published: boolean) {
    await this.filesRepository.update({ id: fileId }, { published })
  }

  async fileExists(getFileDto: GetFileDTO) {
    const fileExists = await this.filesRepository.findOne({
      where: { id: getFileDto.fileId },
      relations: { owners: true },
    })

    return fileExists
  }
}
