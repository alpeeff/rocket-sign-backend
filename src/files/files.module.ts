import { Module } from '@nestjs/common'
import { S3Module } from 'src/s3/s3.module'
import { FilesService } from './files.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FileEntity } from './file.entity'

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), S3Module],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
