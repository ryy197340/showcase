import {memo} from 'react';

import {FacetOption, MultiplesFacet} from '~/lib/constructor/types';

type Props = {
  facet: MultiplesFacet;
  option: FacetOption;
  onFacetOptionSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  checked: Record<string, boolean>;
  boxed?: boolean;
};

function FacetCheckbox({
  facet,
  option,
  onFacetOptionSelect,
  checked,
  boxed = false,
}: Props) {
  if (boxed) {
    return (
      <label
        htmlFor={`${facet.name}|${option.value}`}
        className="flex h-[50px] w-[50px] cursor-pointer flex-col justify-center border-2 border-slate-200 has-[:checked]:border-slate-500 has-[:checked]:bg-slate-100 lg:h-[40px] lg:w-[40px]"
      >
        <input
          type="checkbox"
          id={`${facet.name}|${option.value}`}
          className="hidden"
          onChange={onFacetOptionSelect}
          checked={checked[`${facet.name}|${option.value}`] || false}
          aria-checked={checked[`${facet.name}|${option.value}`] || false}
        />
        <p className="w-full text-center">{option.display_name}</p>
      </label>
    );
  }

  return (
    <>
      <input
        type="checkbox"
        id={`${facet.name}|${option.value}`}
        className="mr-2 cursor-pointer "
        onChange={onFacetOptionSelect}
        checked={checked[`${facet.name}|${option.value}`] || false}
        aria-checked={checked[`${facet.name}|${option.value}`] || false}
      />
      <label
        htmlFor={`${facet.name}|${option.value}`}
        className="cursor-pointer hover:underline"
      >
        {option.display_name}
      </label>
    </>
  );
}

export default memo(FacetCheckbox);
