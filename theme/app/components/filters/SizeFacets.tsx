import {memo} from 'react';

import {FacetOption, MultiplesFacet} from '~/lib/constructor/types';
import {returnCamelCaseStringWithSpaces, sizeSorter} from '~/lib/utils';

import FacetCheckbox from './FacetCheckbox';

type Props = {
  facet: MultiplesFacet;
  checked: Record<string, boolean>;
  onFacetOptionSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function SizeFacets({facet, checked, onFacetOptionSelect}: Props) {
  const groupOptionsByCategory = (options: FacetOption[]) => {
    const groups: Record<string, FacetOption[]> = {
      Mens: [],
      Womens: [],
      MensShoes: [],
      WomensShoes: [],
      NoCategory: [],
    };

    options.forEach((option: FacetOption) => {
      if (option.value.startsWith('Men--')) {
        groups.Mens.push(option);
      } else if (option.value.startsWith('Women--')) {
        groups.Womens.push(option);
      } else if (option.value.startsWith("Men's Shoes--")) {
        groups.MensShoes.push(option);
      } else if (option.value.startsWith("Women's Shoes--")) {
        groups.WomensShoes.push(option);
      } else {
        groups.NoCategory.push(option);
      }
    });

    return groups;
  };
  const groups = groupOptionsByCategory(facet.options);
  return (
    <ul className="w-full">
      {Object.entries(groups)
        .sort(([categoryA], [categoryB]) => {
          const order = [
            'NoCategory',
            'Womens',
            'WomensShoes',
            'Mens',
            'MensShoes',
          ];
          const indexA = order.indexOf(categoryA);
          const indexB = order.indexOf(categoryB);

          if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Both categories are in the order array
          if (indexA !== -1) return -1; // Only categoryA is in the order array
          if (indexB !== -1) return 1; // Only categoryB is in the order array
          return 0; // Neither category is in the order array
        })
        .map(([category, options]) => {
          if (options.length === 0) return null;

          return (
            <li key={category} className="mt-4 block">
              <fieldset>
                {category !== 'NoCategory' && (
                  <legend
                    className="text-sm font-bold"
                    data-category-name={returnCamelCaseStringWithSpaces(
                      category,
                    )}
                  >
                    {returnCamelCaseStringWithSpaces(category)}
                    {/* {category.split('--')[1]} */}
                  </legend>
                )}
                <ul className="flex flex-wrap gap-2">
                  {options.sort(sizeSorter).map((option) => {
                    const displayName = option.display_name.split('--').pop();
                    option.display_name = displayName
                      ? displayName
                      : option.display_name;
                    return (
                      <li key={option.value} className="p-1">
                        <FacetCheckbox
                          facet={facet}
                          option={option}
                          onFacetOptionSelect={onFacetOptionSelect}
                          checked={checked}
                          boxed={true}
                        />
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            </li>
          );
        })}
    </ul>
  );
}

export default memo(SizeFacets);
