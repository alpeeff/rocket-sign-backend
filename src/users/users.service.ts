import { Injectable } from '@nestjs/common'
import { FilesService } from 'src/files/files.service'
import { User } from './user.entity'
import { FileDTO } from 'src/files/types'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private filesService: FilesService,
  ) {}

  async setAvatar(user: User, file: FileDTO) {
    const id = await this.filesService.upload(
      user,
      'avatar',
      file.buffer,
      file.contentType,
    )

    await this.usersRepository.update({ id: user.id }, { avatarId: id })
  }

  async deleteAvatar(user: User) {
    return await this.filesService.delete(user.avatarId)
  }
}
