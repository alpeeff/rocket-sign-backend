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
export class ReportType {
  @PrimaryGeneratedColumn('increment')
  id: number

  @OneToMany(
    () => ReportTypeTranslation,
    (translation) => translation.reportType,
  )
  translations: ReportTypeTranslation[]

  @Column()
  price: number
}

export interface TranslatedReportType extends Omit<ReportType, 'translations'> {
  name: string
  description: string
}

@Entity()
export class ReportTypeTranslation implements Translatable {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => ReportType, (reportType) => reportType.translations)
  reportType: ReportType

  @Column()
  languageCode: string

  @UpdateDateColumn()
  updatedAt: string

  @Column()
  name: string

  @Column()
  description: string
}

export function translateReportType(
  reportType: ReportType,
  language: string,
): TranslatedReportType {
  const { translations, ...rest } = reportType

  return {
    ...rest,
    description: getTranslation(translations, language, 'description'),
    name: getTranslation(translations, language, 'name'),
  }
}
