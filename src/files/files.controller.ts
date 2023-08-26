import { Controller, Get, StreamableFile, UseGuards } from '@nestjs/common'
import { FilesService } from './files.service'
import { FilesGuard } from './files.guard'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import { FileParam } from './files.decorator'
import { FileEntity } from './file.entity'

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Get(':fileId')
  @UseGuards(FilesGuard)
  @AuthGuard()
  async getOrderFile(@FileParam() file: FileEntity) {
    const { buffer, contentType } = await this.filesService.get(file.id)
    return new StreamableFile(buffer, { type: contentType })
  }
}
