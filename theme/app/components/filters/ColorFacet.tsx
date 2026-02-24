import clsx from 'clsx';
import {memo} from 'react';

import {FacetOption, MultiplesFacet} from '~/lib/constructor/types';
import {getColorByName} from '~/utils';

type Props = {
  option: FacetOption;
  facet: MultiplesFacet;
  onFacetOptionSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  checked: Record<string, boolean>;
};

function ColorFacet({
  option,
  facet,
  onFacetOptionSelect,
  checked,
  facetFilters,
}: Props) {
  return (
    <div
      className={clsx({
        'ring-2 ring-primary':
          facetFilters?.[facet.name] &&
          facetFilters?.[facet.name]?.includes(option.value),
        'mt-1 flex h-6 w-6 items-center gap-2 rounded-full border-[1px] border-solid border-gray':
          true,
      })}
      aria-label={option.display_name}
      style={{
        background: getColorByName(option.value as string),
      }}
    >
      <label
        htmlFor={`${facet.name}|${option.value}`}
        className="cursor-pointer pl-8"
      >
        <input
          type="checkbox"
          id={`${facet.name}|${option.value}`}
          style={{display: 'none'}}
          onChange={onFacetOptionSelect}
          checked={checked[`${facet.name}|${option.value}`] || false}
          aria-checked={checked[`${facet.name}|${option.value}`] || false}
        />
        {option.display_name}
      </label>
    </div>
  );
}

export default memo(ColorFacet);
