import es from './es.json';
import en from './en.json';

export type Locale = 'es' | 'en';
export type Translations = typeof es;

const translations: Record<Locale, Translations> = { es, en };

export function getTranslations(locale: string): Translations {
  if (locale === 'en') return en;
  return es;
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, lang] = url.pathname.split('/');
  if (lang === 'en') return 'en';
  return 'es';
}

export function getRelativeUrl(url: URL, targetLocale: Locale): string {
  const [, lang, ...rest] = url.pathname.split('/');
  const path = rest.join('/');
  
  if (targetLocale === 'es') {
    return `/${path}`;
  }
  return `/${targetLocale}/${path}`;
}
