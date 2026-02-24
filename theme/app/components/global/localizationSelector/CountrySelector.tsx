import {Listbox} from '@headlessui/react';
import {useFetcher, useMatches} from '@remix-run/react';
import clsx from 'clsx';
import {useContext, useEffect, useState} from 'react';
import Flag from 'react-world-flags';
import invariant from 'tiny-invariant';

import {DEFAULT_LOCALE} from '~/lib/utils';
import {GlobalContext} from '~/lib/utils';
import type {I18nLocale, Locale} from '~/types/shopify';

import Countries from './Countries';

export function CountrySelector() {
  const {locale, setLocale: setLocaleContext} = useContext(GlobalContext);
  const fetcher = useFetcher();

  const [listboxOpen, setListboxOpen] = useState(false);

  const fetcherLocaleLabel = fetcher?.formData?.get('label');
  const fetcherLocaleCountry = fetcher?.formData?.get('country');
  const [root] = useMatches();
  const selectedLocale: I18nLocale =
    locale || (root?.data?.locale as I18nLocale) || DEFAULT_LOCALE;
  const selectedLocalePrefix = `${selectedLocale?.language}-${selectedLocale?.country}`;

  const localization =
    typeof fetcherLocaleLabel === 'string'
      ? fetcherLocaleLabel
      : selectedLocale.label;
  const flagCode =
    typeof fetcherLocaleCountry === 'string'
      ? fetcherLocaleCountry
      : selectedLocale.country;

  const setLocale = (newLocale: Locale) => {
    invariant(newLocale, 'newLocale is required');
    const newLocalePrefix = `${newLocale?.language}-${newLocale?.country}`;

    if (newLocalePrefix !== selectedLocalePrefix) {
      setLocaleContext(newLocale); // Update the locale context
    }
  };

  const RenderListBox = ({open}: {open: boolean}) => {
    useEffect(() => {
      setListboxOpen(open);
    }, [open]);

    return (
      <div className="relative inline-flex">
        <Listbox.Button
          className={clsx(
            'flex h-[35px] items-center rounded-sm bg-darkGray bg-opacity-0 px-3 text-2xs uppercase leading-none duration-150',
            'hover:bg-opacity-10',
          )}
        >
          <span className="mr-2 font-semibold">
            Shipping to: {localization}
          </span>
          {(fetcherLocaleCountry || selectedLocale.country) && (
            <div className="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full">
              <Flag
                code={flagCode}
                alt={localization}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </Listbox.Button>

        <Listbox.Options
          className={clsx(
            'lg:left absolute bottom-full z-10 mt-3 min-w-[150px] overflow-hidden rounded shadow lg:bottom-auto lg:top-full',
          )}
        >
          <div className="max-h-64 overflow-y-auto bg-white">
            {listboxOpen && (
              <Countries
                selectedLocalePrefix={selectedLocalePrefix}
                getClassName={(active: boolean) => {
                  return clsx([
                    'p-3 flex justify-between items-center text-left font-bold text-sm cursor-pointer whitespace-nowrap text-primary',
                    active ? 'bg-darkGray bg-opacity-5' : null,
                  ]);
                }}
              />
            )}
          </div>
        </Listbox.Options>
      </div>
    );
  };

  return (
    <Listbox onChange={setLocale} value={selectedLocale}>
      {({open}) => <RenderListBox open={open} />}
    </Listbox>
  );
}
