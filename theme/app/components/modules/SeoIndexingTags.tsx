import {useLocation} from '@remix-run/react';

import type {Locales} from '~/lib/utils';
import type {I18nLocale} from '~/types/shopify';

type SeoIndexingTagsProps = {
  locale: I18nLocale;
  availableLocales: Locales;
};

export function SeoIndexingTags({
  locale,
  availableLocales,
}: SeoIndexingTagsProps) {
  const location = useLocation();

  const pathnameWithoutLocale =
    location.pathname
      .replace(/^\/[a-z]{2}-[a-z]{2}\//, '/')
      .replace(/^\/[a-z]{2}-[a-z]{2}$/, '/')
      .replace(/\/$/, '') || '/';

  // Hreflang and Canonical Tags are only generated for included locales
  // noindex tag added for non included urls
  const localeCode = `${locale.language.toLowerCase()}-${locale.country.toUpperCase()}`;
  const shouldIndexPage = ['en-CA', 'en-AU', 'en-GB', 'en-US'].includes(
    localeCode,
  );

  return (
    <>
      {!shouldIndexPage && <meta name="robots" content="noindex, follow" />}
      {shouldIndexPage && (
        <>
          <link
            rel="canonical"
            href={`https://www.jmclaughlin.com${location.pathname}`}
          />
          {/* Open Graph Canonical Tag */}
          <meta
            property="og:url"
            content={`https://www.jmclaughlin.com${location.pathname}`}
          />

          {/* Dynamically Generated hreflang Tags */}
          {Object.values(availableLocales).map(
            ({language, country, pathPrefix}) => {
              const localeCode = `${language.toLowerCase()}-${country.toUpperCase()}`;
              if (!['en-CA', 'en-AU', 'en-GB', 'en-US'].includes(localeCode)) {
                return null;
              }

              const cleanPathPrefix = pathPrefix.replace(/\/$/, '');
              const finalHref =
                `${cleanPathPrefix}${pathnameWithoutLocale}`.replace(
                  /\/+$/,
                  '',
                ) || '/';

              return (
                <link
                  key={`${language}-${country}`}
                  rel="alternate"
                  hrefLang={localeCode}
                  href={`https://www.jmclaughlin.com${finalHref}`}
                />
              );
            },
          )}

          {/* en and x-default point to en-US site */}
          <link
            rel="alternate"
            hrefLang="en"
            href={`https://www.jmclaughlin.com${pathnameWithoutLocale}`}
          />
          <link
            rel="alternate"
            hrefLang="x-default"
            href={`https://www.jmclaughlin.com${pathnameWithoutLocale}`}
          />
        </>
      )}
    </>
  );
}
