import {useEffect, useState} from 'react';

import {I18nLocale} from '~/types/shopify';

const useDetermineInitialLocale = (
  setLocaleAndUpdate: (locale: I18nLocale) => void,
  selectedLocale: I18nLocale,
  checkoutLocaleObj: I18nLocale | null | undefined,
) => {
  const [readyToSetLocale, setReadyToSetLocale] = useState(false);

  // Effect to check readiness
  // We need to have all the informatino before we determine the locale
  // path prefix, checkoutLocaleObj, localStorage, and selectedLocale
  // 1. path prefix - if there is one, we use it and set the selectedLocale, localStorage and checkoutLocaleObject to it, then we check ...

  // 2. checkoutLocaleObj - if it exists, we use it and set the selectedLocale, path prefix and localStorage to it, then we check ...

  // 3. localStorage - if it exists, we use it and set the selectedLocale, path prefix and checkoutLocaleObject to it, otherwise ...

  // 4. selectedLocale - use it and set the path prefix, localStorage and checkoutLocaleObject to the selectedLocale

  // if path prefix isn't blank, we use it and set the selectedLocale and checkoutLocaleObject to it
  // if checkoutLocaleObj is blank, we check localStorage for the locale
  // if localStorage is blank, we check selectedLocale for the locale
  // checkoutLocaleObj is the most important, as it is the locale from the checkout -- if it exists, we use it and set the selectedLocale to it
  // selectedLocale is the locale from the user's selection, and is second most important
  useEffect(() => {
    if (
      checkoutLocaleObj !== undefined ||
      localStorage.getItem('locale') !== null ||
      selectedLocale !== undefined
    ) {
      setReadyToSetLocale(true);
    }
  }, [checkoutLocaleObj, selectedLocale]); // Depends on checkoutLocaleObj and selectedLocale being defined

  useEffect(() => {
    if (readyToSetLocale) {
      const storedLocaleJSON = localStorage.getItem('locale');
      if (checkoutLocaleObj) {
        try {
          setLocaleAndUpdate(checkoutLocaleObj);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(
            'Error parsing locale from checkout locale object',
            error,
          );
        }
      } else if (storedLocaleJSON) {
        try {
          const sessionStoredLocale = JSON.parse(storedLocaleJSON);
          setLocaleAndUpdate(sessionStoredLocale);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error parsing locale from local storage', error);
        }
      } else {
        setLocaleAndUpdate(selectedLocale);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure cleanup if component unmounts
  useEffect(() => {
    return () => {
      setReadyToSetLocale(false); // Reset on unmount, if needed
    };
  }, []);
};

export default useDetermineInitialLocale;
