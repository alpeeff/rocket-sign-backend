import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { ConfigService } from './src/config/config.service'
import { ConfigService as NestConfigService } from '@nestjs/config'
import {
  ReportType,
  ReportTypeTranslation,
} from './src/report-type/report-type.entity'
import {
  DeliveryType,
  DeliveryTypeTranslation,
} from './src/delivery-type/delivery-type.entity'
import { Seed1697194305744 } from 'src/db/migrations/1697194305744-Seed'

config()

const configService = new ConfigService(new NestConfigService())

export default new DataSource({
  type: 'postgres',
  synchronize: false,
  host: configService.get('DB_HOST'),
  port: configService.getNumber('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: [
    DeliveryType,
    DeliveryTypeTranslation,
    ReportType,
    ReportTypeTranslation,
  ],
  migrations: [Seed1697194305744],
})
