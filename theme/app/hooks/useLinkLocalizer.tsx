import {useContext, useMemo} from 'react';

import {
  isCountryLocalePrefix,
  normalizeAndReturnPathSegments,
} from '~/components/global/localizationSelector/utils';
import {GlobalContext} from '~/lib/utils';

const isExternal = (url: string) => {
  try {
    return (
      new URL(url, window.location.href).hostname !== window.location.hostname
    );
  } catch (e) {
    return false;
  }
};

export function useLinkLocalizer() {
  const {locale} = useContext(GlobalContext);

  // return localizePath;
  return useMemo(() => {
    return (path: string) => {
      if (isExternal(path)) return path;

      // Split path into segments
      const segments = normalizeAndReturnPathSegments(path);

      // If the first segment is a country locale prefix, use it; otherwise, use the current locale
      const prefix = isCountryLocalePrefix(segments[0])
        ? segments.shift() // Remove and use the first segment as prefix
        : locale?.country && locale.country !== 'US'
        ? `${locale.language.toLowerCase()}-${locale.country.toLowerCase()}`
        : '';

      // Check if it's a blog or store locator path
      const isBlog = segments[0] === 'blog';
      const isStoreLocator = segments.some((segment) =>
        segment.includes('store-locator'),
      );

      if (isBlog || isStoreLocator) {
        return `/${segments.join('/')}`.replace('//', '/');
      }

      // Reconstruct the path with the appropriate prefix
      return `/${prefix}/${segments.join('/')}`.replace('//', '/'); // Ensure no double slashes
    };
  }, [locale]);
}
