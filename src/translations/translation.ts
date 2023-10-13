export const translationLanguageCodes = ['uk', 'en']

export interface Translatable {
  id: string
  languageCode: string
  updatedAt: string
}

export function getTranslation<T extends Translatable, TKey extends keyof T>(
  translations: T[],
  language: string,
  key: TKey,
): T[TKey] | undefined {
  return translations.find((x) => x.languageCode === language)?.[key]
}
