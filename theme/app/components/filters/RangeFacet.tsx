import {useNavigate} from '@remix-run/react';
import {memo, useEffect, useMemo, useState} from 'react';
import RangeSlider from 'react-range-slider-input';

import {RangeFacet as Facet} from '~/lib/constructor/types';
import {capitalizeString, useDebounce} from '~/lib/utils';

import CloseIcon from '../icons/Close';
import {FacetCaret} from '../icons/FacetCaret';

type Props = {
  facet: Facet;
  selectedFacet: string | null;
  liClassNames: string;
  handleFacetClick: (facet: Facet) => void;
  params: URLSearchParams;
  setSelectedFacet: (facet: string | null) => void;
  totalProducts: number;
  facetFilters: Record<string, string[]>;
};

function RangeFacet({
  facet,
  selectedFacet,
  liClassNames,
  handleFacetClick,
  params,
  setSelectedFacet,
  totalProducts,
  facetFilters,
}: Props) {
  const priceRange = facet.options
    .map((option) => option.value)
    .sort((a, b) => a - b);
  const [range, setRange] = useState<number[]>([
    0,
    priceRange[priceRange.length - 1],
  ]);
  useEffect(() => {
    if (
      facetFilters?.price_max === undefined &&
      facetFilters?.price_min === undefined
    ) {
      setRange([0, priceRange[priceRange.length - 1]]);
    } else {
      setRange([facetFilters?.price_min || 0, facetFilters?.price_max]);
    }
  }, [facetFilters]);

  const navigate = useNavigate();
  const onRangeChange = useDebounce((event: number[]) => {
    setRange(event);
  }, 500);

  const facetName = useMemo(() => {
    let countOfSelectedOptions = 0;
    let selectedOptionName = '';

    if ('options' in facet) {
      for (const option of facet.options) {
        if (option.status === 'selected') {
          countOfSelectedOptions++;
          selectedOptionName = option.display_name;
        }
      }
    }

    const capitalizedFacetName = capitalizeString(facet.display_name);

    if (countOfSelectedOptions === 0) {
      return capitalizedFacetName;
    } else if (countOfSelectedOptions === 1) {
      return `${capitalizedFacetName}: ${selectedOptionName}`;
    } else {
      return `${capitalizedFacetName}: ${countOfSelectedOptions} options`;
    }
  }, [facet]);

  // useEffect(() => {
  //   if ('min' in facet && 'max' in facet) {
  //     // set range min and max limits
  //     setRange([facet.min, facet.max]);
  //   }
  // }, [facet]);

  const onRangeSelect = async (range: number[]) => {
    const filterKey = 'filters[price]';
    const newValue = range.join('-');
    if (newValue) {
      params.set(filterKey, newValue);
    } else {
      params.delete(filterKey);
    }
    navigate({search: params.toString()}, {preventScrollReset: true});
  };

  return (
    <li
      key={facet.name}
      className={`after:block after:h-[1px] after:w-full after:scale-0 after:bg-primary ${
        selectedFacet === facet.name ? 'after:scale-100' : 'after:scale-0'
      } after:transition-all after:duration-300`}
    >
      <button
        className={liClassNames}
        onClick={() => handleFacetClick(facet)}
        aria-label={`Toggle ${facet.display_name} options`}
        aria-controls={`facetList-${facet.name}`}
        aria-expanded={selectedFacet === facet.name}
      >
        {facetName}
        <div
          className="transition-transform duration-300"
          style={{
            transform: selectedFacet === facet.name ? 'rotate(180deg)' : '',
          }}
        >
          <FacetCaret />
        </div>
      </button>
      <div
        className={`h-fit w-full border-b-2 border-b-lightGray bg-white pb-4 pt-2 lg:absolute lg:left-0 lg:top-full lg:z-20 lg:px-10 lg:pb-5 ${
          selectedFacet === facet.name
            ? 'flex flex-col items-start gap-3'
            : 'hidden'
        }`}
      >
        <div className="flex w-full flex-row items-center justify-start gap-4 lg:gap-8">
          <span className="shrink-0 text-sm" id="range_min">
            ${range[0]}
          </span>
          <div className="flex-1 lg:w-60 lg:flex-none">
            <RangeSlider
              key={`${facetFilters?.price_min}-${facetFilters?.price_max}`}
              id={facet.name}
              min={0}
              max={priceRange[priceRange.length - 1]}
              name={facet.name}
              defaultValue={[
                facetFilters?.price_min || 0,
                facetFilters?.price_max || priceRange[priceRange.length - 1],
              ]}
              onInput={onRangeChange}
            />
          </div>
          <span className="shrink-0 text-sm" id="range_max">
            ${range[1]}
          </span>
          <button
            aria-label="Apply selected range"
            className="shrink-0 bg-primary px-4 py-2 uppercase text-white focus:border-blue-300 focus:outline-none focus:ring"
            onClick={() => onRangeSelect(range)}
          >
            Apply
          </button>
          <button
            className="absolute right-0 top-0 mx-10 my-2 hidden opacity-75 lg:block"
            onClick={() => setSelectedFacet(null)}
          >
            <CloseIcon />
          </button>
        </div>
        <p className="totalResults mt-4 flex w-full justify-start pt-2 text-darkGray">
          <span className="whitespace-nowrap">
            {totalProducts} items available
          </span>
        </p>
      </div>
    </li>
  );
}

export default memo(RangeFacet);
