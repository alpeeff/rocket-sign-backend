import { IsIn } from 'class-validator'
import { translationLanguageCodes } from '../translation'

export class TranslatableRequestDTO {
  @IsIn(translationLanguageCodes)
  languageCode: string
}
