import {Fetcher, NavigateFunction} from '@remix-run/react';
import {CartForm} from '@shopify/hydrogen';
import {localeConfirmationCookie} from 'server';

import {countries} from '~/data/countries';
import {Locale} from '~/types/shopify';
import {returnLocalePrefix} from '~/utils/global';

const localeRegex = /^[a-z]{2}-[a-z]{2}$/;
// Country Selector
export function isCountryLocalePrefix(segment: string): boolean {
  // This regex can be adjusted based on the specific format of your locale strings
  return localeRegex.test(segment);
}

const defaultLocale = countries?.['default'];
const defaultLocalePrefix = returnLocalePrefix(defaultLocale);

export const localePrefixUpdate = async (
  currentUrl: string,
  fetcher: Fetcher,
  {language, country}: Locale,
  selectedLocale: Locale,
  navigate: NavigateFunction,
  baseDomain: string,
) => {
  const newLocalePrefix = `${language}-${country}`;
  const {language: selectedLanguage, country: selectedCountry = country} =
    selectedLocale;
  const selectedLocalePrefix = `${selectedLanguage}-${selectedCountry}`;

  if (newLocalePrefix !== selectedLocalePrefix) {
    const countryUrlPath = getCountryUrlPath({
      newCountryLocale: {
        language,
        country,
        label: selectedLocale.label,
        currency: selectedLocale.currency,
      },
      defaultLocalePrefix,
      baseDomain,
      currentPath: currentUrl,
    });

    // Prevent redirecting to the same path which could cause infinite loops
    if (countryUrlPath === currentUrl) {
      // eslint-disable-next-line no-console
      console.log('No locale change detected, no navigation needed.');
      return;
    }

    try {
      await fetcher.submit(
        {
          cartFormInput: JSON.stringify({
            action: CartForm.ACTIONS.BuyerIdentityUpdate,
            inputs: {buyerIdentity: {countryCode: country}},
          }),
        },
        {method: 'post', action: '/cart?index', preventscroll: true},
      );
      // refreshing page with new locale
      navigate(countryUrlPath);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error during fetch and navigate:', error);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('No locale change detected, no navigation needed.');
  }
};
export function getCountryUrlPath({
  newCountryLocale,
  defaultLocalePrefix,
  baseDomain,
  currentPath,
}: {
  newCountryLocale: Locale;
  defaultLocalePrefix: string;
  baseDomain: string;
  currentPath: string;
}) {
  const newCountryLocalePrefix = `${returnLocalePrefix(newCountryLocale)}`;
  const isNewCountryDefault =
    newCountryLocale.country === countries.default.country; // Check if the new country is the default
  const requestUrl = new URL(baseDomain + currentPath);
  let basePathSegments = requestUrl.pathname
    .split('/')
    .filter((segment) => segment);
  if (
    // if there are baseBathSegments and the first segment is a country locale prefix
    basePathSegments.length > 0 &&
    isCountryLocalePrefix(basePathSegments[0])
  ) {
    if (isNewCountryDefault) {
      // If the new country is the default, remove the prefix
      basePathSegments.shift();
    } else if (newCountryLocalePrefix !== defaultLocalePrefix) {
      basePathSegments[0] = newCountryLocalePrefix;
    }
  } else if (
    !isNewCountryDefault &&
    newCountryLocalePrefix !== defaultLocalePrefix &&
    defaultLocalePrefix
  ) {
    // Add the newCountryLocalePrefix if not the default and the country is not the US
    basePathSegments = [newCountryLocalePrefix, ...basePathSegments];
  }
  const modifiedPathname = `/${basePathSegments.join('/')}/`;
  // Construct the full URL with the modified pathname
  const fullPath = `${modifiedPathname.replace(/\/{2,}/g, '/')}${
    requestUrl.search
  }${requestUrl.hash}`;
  return fullPath;
}

// get all country data
// a series of functions to fetch and format country data based on up to date data from restcountries.com
// not in use but available as needed; this informed Countries.ts
const fetchCountries = async () => {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching country data:', error);
    return [];
  }
};

const formatCountryData = (countries: any[]) => {
  const formattedData: Record<string, any> = {};

  countries.forEach((country) => {
    const path = `/en-${country.cca2.toLowerCase()}`;
    const currencyCode = country.currencies
      ? Object.keys(country.currencies)[0]
      : 'Unknown';

    formattedData[path] = {
      label: country.name.common,
      language: 'EN', // Assuming English as a default language
      country: country.cca2,
      currency: currencyCode,
    };
  });

  // Sorting the formatted data by label
  const sortedData = Object.entries(formattedData)
    .sort((a, b) => a[1].label.localeCompare(b[1].label))
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {} as Record<string, any>);

  return sortedData;
};

export const getCountries = async () => {
  const countries = await fetchCountries();
  if (Array.isArray(countries)) {
    const formattedCountries = formatCountryData(countries);
    // eslint-disable-next-line no-console
    console.log(formattedCountries);
  } else {
    // handle the case where countries is not an array
  }
  return countries;
};

export const updateLocaleConfirmations = async (
  locale: string,
  cookieHeader: string | undefined,
) => {
  let localeConfirmations: {[key: string]: any} = {};

  try {
    // try to parse existing cookie data
    localeConfirmations =
      (await localeConfirmationCookie.parse(cookieHeader || '')) || {};
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing locale confirmation cookie:', error);
  }

  // update the cookie data with the new locale
  localeConfirmations[locale] = Date.now();

  // Serialize the updated cookie data back into a string
  const serializedCookie = await localeConfirmationCookie.serialize(
    localeConfirmations,
  );
  return serializedCookie;
};

export const normalizeAndReturnPathSegments = (path: string) => {
  // Normalize path to ensure it does not start with a '/'
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  // Split path into segments
  return normalizedPath.split('/').filter(Boolean); // filter(Boolean) removes empty segments
};

export const getLocalePrefixFromUrl = (urlString: string): string | null => {
  try {
    const url = new URL(urlString);
    const pathSegments = url.pathname.split('/').filter(Boolean); // Split the path and remove any empty segments
    if (pathSegments.length > 0 && isCountryLocalePrefix(pathSegments[0])) {
      return pathSegments[0]; // Return the first segment if it's a country locale prefix
    }
    return 'us'; // Return us, default country, if no other country locale prefix is found
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Invalid URL:', error);
    return null; // Return null in case of an invalid URL
  }
};
