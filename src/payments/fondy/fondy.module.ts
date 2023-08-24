import { Module } from '@nestjs/common'
import { FondyService } from './fondy.service'
import { ConfigModule } from 'src/config/config.module'

@Module({
  imports: [ConfigModule],
  exports: [FondyService],
  providers: [FondyService],
})
export class FondyModule {}
