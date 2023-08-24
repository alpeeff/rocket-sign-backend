import { Module } from '@nestjs/common'
import { ConfigService } from './config.service'
import { ConfigModule as NestConfigModule } from '@nestjs/config'

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
  imports: [NestConfigModule],
})
export class ConfigModule {}
