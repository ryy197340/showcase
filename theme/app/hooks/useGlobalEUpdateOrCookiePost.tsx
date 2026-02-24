import {useEffect} from 'react';

import {postLocaleCookie} from '~/lib/utils';
import {I18nLocale} from '~/types/shopify';

const useGlobalEUpdateOrCookiePost = (
  locale: I18nLocale,
  pathPrefixLocale: I18nLocale,
  promptLocaleConfirmation: boolean,
  setLocaleAndUpdate: (locale: I18nLocale) => void,
) => {
  useEffect(() => {
    if (promptLocaleConfirmation) {
      setLocaleAndUpdate(pathPrefixLocale);
    } else {
      postLocaleCookie(locale, locale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptLocaleConfirmation, locale.country, pathPrefixLocale.country]);
};

export default useGlobalEUpdateOrCookiePost;
