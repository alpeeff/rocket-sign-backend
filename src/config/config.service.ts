import { Injectable } from '@nestjs/common'
import { ConfigService as NestConfigService } from '@nestjs/config'
import { ConfigServiceEnvType } from 'src/types/config'

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService<ConfigServiceEnvType>) {}

  get<TConfig extends ConfigServiceEnvType, TKey extends keyof TConfig>(
    key: TKey,
  ): TConfig[TKey] {
    return this.configService.get(key as keyof ConfigServiceEnvType)
  }

  getNumber<
    TConfig extends FilteredProperties<ConfigServiceEnvType>,
    TKey extends keyof TConfig,
  >(key: TKey): number {
    return +this.configService.get(key as keyof ConfigServiceEnvType)
  }
}

type FilteredProperties<T> = {
  [K in keyof T as T[K] extends number ? K : never]: T[K]
}
