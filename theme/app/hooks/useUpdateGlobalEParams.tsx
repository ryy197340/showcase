import {useEffect} from 'react';

import {I18nLocale} from '~/types/shopify';
import {updateGlblParams} from '~/utils/global';

const useGlobalEParamsUpdate = (locale: I18nLocale, storeDomain: any) => {
  useEffect(() => {
    if (locale) {
      updateGlblParams(locale.country, locale.currency, storeDomain);
      // Sync active currency for GTM
      if (typeof window !== 'undefined') {
        (window as any).__activeCurrency = locale.currency;
      }
    }
  }, [locale, storeDomain]);
};

export default useGlobalEParamsUpdate;
