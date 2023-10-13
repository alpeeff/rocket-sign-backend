import { Translatable, getTranslation } from 'src/translations/translation'
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity()
export class DeliveryType {
  @PrimaryGeneratedColumn('increment')
  id: number

  @OneToMany(
    () => DeliveryTypeTranslation,
    (translation) => translation.deliveryType,
  )
  translations: DeliveryTypeTranslation[]

  @Column()
  price: number
}

export interface TranslatedDeliveryType
  extends Omit<DeliveryType, 'translations'> {
  name: string
}

@Entity()
export class DeliveryTypeTranslation implements Translatable {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => DeliveryType, (reportType) => reportType.translations)
  deliveryType: DeliveryType

  @Column()
  languageCode: string

  @UpdateDateColumn()
  updatedAt: string

  @Column()
  name: string
}

export function translateDeliveryType(
  deliveryType: DeliveryType,
  language: string,
): TranslatedDeliveryType {
  const { translations, ...rest } = deliveryType

  return {
    ...rest,
    name: getTranslation(translations, language, 'name'),
  }
}
