import {useEffect, useState} from 'react';

import {Locales, returnLocaleByCountryCode} from '~/lib/utils';
import {I18nLocale} from '~/types/shopify';

function useLocaleDetermination(
  pathPrefixLocale: I18nLocale,
  data: any,
  availableLocales: Locales,
  selectedLocale: I18nLocale,
  setLocaleAndUpdate: (locale: I18nLocale) => void,
) {
  // State to manage the checkout locale object asynchronously fetched from `data.cart`
  const [checkoutLocaleObj, setCheckoutLocaleObj] = useState<
    I18nLocale | undefined
  >(undefined);

  // Effect to resolve `data.cart` promise and extract `checkoutLocale`
  useEffect(() => {
    data.cart
      .then((cart: any) => {
        if (cart === null) {
          setCheckoutLocaleObj(undefined);
          return; // Early return to prevent further execution since cart is null
        }
        const attributes = cart.attributes ?? undefined; // Access attributes directly from the cart object

        // Find the checkout locale attribute by its key
        const checkoutLocale = attributes?.find(
          (attr: {key: string}) => attr.key === 'checkoutLocale',
        )?.value;

        // If checkoutLocale is found, convert it to a locale object; otherwise set to undefined
        if (checkoutLocale) {
          const localeObj = returnLocaleByCountryCode(
            checkoutLocale,
            availableLocales,
          );
          setCheckoutLocaleObj(localeObj);
        } else {
          setCheckoutLocaleObj(undefined); // Explicitly set to undefined if no checkoutLocale is found
        }
      })
      .catch((error: any) => {
        // eslint-disable-next-line no-console
        console.error('Error resolving cart:', error);
        setCheckoutLocaleObj(undefined); // Handle errors in promise resolution
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.cart]); // This effect depends only on `data.cart`

  // State to indicate readiness to set the locale
  const [readyToSetLocale, setReadyToSetLocale] = useState(false);
  useEffect(() => {
    // Set locale when a valid locale object is available or a fallback from local storage or default is possible
    if (
      checkoutLocaleObj !== undefined ||
      localStorage.getItem('locale') !== null ||
      selectedLocale !== undefined
    ) {
      setReadyToSetLocale(true);
    }
  }, [checkoutLocaleObj, selectedLocale]); // Dependence on locale object and selected locale

  // Effect to update the locale once ready
  useEffect(() => {
    if (readyToSetLocale) {
      const storedLocaleJSON = localStorage.getItem('locale');
      if (pathPrefixLocale.country !== 'US') {
        setLocaleAndUpdate(pathPrefixLocale);
      } else if (checkoutLocaleObj) {
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
  }, [readyToSetLocale]);

  // Ensure cleanup if component unmounts
  useEffect(() => {
    return () => {
      setReadyToSetLocale(false); // Reset ready state on unmount to avoid stale state issues
    };
  }, []);
}

export default useLocaleDetermination;
