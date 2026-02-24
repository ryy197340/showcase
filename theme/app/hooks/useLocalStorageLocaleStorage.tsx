import {useEffect} from 'react';

import {I18nLocale} from '~/types/shopify';

const useLocalStorageLocaleStorage = (
  setLocaleAndUpdate: (locale: I18nLocale) => void,
) => {
  // Check for locale in local storage
  useEffect(() => {
    const storedLocaleJSON = localStorage.getItem('locale');
    if (storedLocaleJSON) {
      try {
        const sessionStoredLocale = JSON.parse(storedLocaleJSON);
        // eslint-disable-next-line no-console
        console.log('sessionStoredLocale', sessionStoredLocale);
        setLocaleAndUpdate(sessionStoredLocale);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error parsing locale from local storage', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export default useLocalStorageLocaleStorage;
