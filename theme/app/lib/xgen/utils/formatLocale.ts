import {DEFAULT_LOCALE} from '~/lib/utils';
import {I18nLocale} from '~/types/shopify';

export default function formatLocale(locale: I18nLocale = DEFAULT_LOCALE) {
  return `${locale.language.toLowerCase()}_${locale.country.toUpperCase()}`;
}
