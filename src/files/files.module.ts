import { Module } from '@nestjs/common'
import { S3Module } from 'src/s3/s3.module'
import { FilesService } from './files.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FileEntity } from './file.entity'
import { FilesController } from './files.controller'
import { CaslModule } from 'src/casl/casl.module'

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), S3Module, CaslModule],
  providers: [FilesService],
  exports: [FilesService],
  controllers: [FilesController],
})
export class FilesModule {}
