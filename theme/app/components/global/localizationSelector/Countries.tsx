import {Listbox} from '@headlessui/react';
import {useContext} from 'react';

import RadioIcon from '~/components/icons/Radio';
import {countriesWithPath} from '~/data/countries';
import {GlobalContext} from '~/lib/utils';
import {Localizations} from '~/types/shopify';
function processCountries(countries: Localizations) {
  // Extract the default entry
  const defaultCountry = countries.default;

  // Filter out the default entry and convert the remaining entries to an array
  const otherCountries = Object.entries(countries)
    .filter(([key]) => key !== 'default')
    .map(([, value]) => value);

  // Alphabetize the array
  otherCountries.sort((a, b) => a.label.localeCompare(b.label));

  // Prepend the default entry to the start of the array
  return [defaultCountry, ...otherCountries];
}

export default function Countries({
  getClassName,
  selectedLocalePrefix,
}: {
  getClassName: (active: boolean) => string;
  selectedLocalePrefix: string;
}) {
  const {availableLocales} = useContext(GlobalContext);
  const processedCountries = processCountries(
    availableLocales || countriesWithPath,
  );
  return (
    <>
      {processedCountries &&
        processedCountries.map((countryLocale, index) => {
          const countryLocalePrefix = `${countryLocale?.language}-${countryLocale?.country}`;
          const isSelected = countryLocalePrefix === selectedLocalePrefix;
          const key = `${countryLocalePrefix}-${index}`;
          return (
            <Listbox.Option key={key} value={countryLocale}>
              {({active}: {active: boolean}) => (
                <div className={getClassName(active)}>
                  <span className="mr-8">{countryLocale.label}</span>
                  <RadioIcon checked={isSelected} hovered={active} />
                </div>
              )}
            </Listbox.Option>
          );
        })}
    </>
  );
}
