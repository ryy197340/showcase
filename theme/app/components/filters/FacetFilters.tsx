import {useNavigate, useSearchParams} from '@remix-run/react';
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {Facet} from '~/lib/constructor/types';

import {parseUrlParameters} from '../../utils';
import ClearButton from './ClearButton';
import MultipleFacet from './MultipleFacet';
import RangeFacet from './RangeFacet';

type Props = {
  facets: Facet[];
  totalProducts: number;
  facetFilters: Record<string, string[]>;
};

type UrlParameters = {
  parameters: {
    filters: Record<string, string[]>;
  };
};

const liClassNames =
  'flex cursor-pointer items-center gap-[10px] whitespace-nowrap capitalize leading-[2] justify-between w-full';

export default function FacetFilters({
  facetFilters,
  facets,
  totalProducts,
}: Props) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const {
    parameters: {filters},
  } = parseUrlParameters() as UrlParameters;
  const [selectedFacet, setSelectedFacet] = useState<string | null>(null);
  const facetRef = useRef<HTMLUListElement | null>(null);

  const checked = useMemo(() => {
    const tmpChecked: Record<string, boolean> = {};

    Object.entries(filters).forEach(([filterGroup, filterOptions]) => {
      if (filterGroup !== 'group_id') {
        filterOptions.forEach((facetOption) => {
          tmpChecked[`${filterGroup}|${facetOption}`] = true;
        });
      }
    });

    return tmpChecked;
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | KeyboardEvent) => {
      if (
        facetRef.current &&
        !facetRef.current.contains(event.target as Node)
      ) {
        setSelectedFacet(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedFacet(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const onFacetOptionSelect = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const facetIdSplit = event?.target?.id?.split('|');
      if (facetIdSplit) {
        const [facetGroup, facetOption] = facetIdSplit;
        const filterKey = `filters[${facetGroup}]`;
        const existingValues = params.get(filterKey);
        let newValue = '';

        if (event?.target?.checked) {
          newValue = existingValues
            ? `${existingValues},${facetOption}`
            : facetOption;
        } else {
          params.delete(filterKey);
          if (existingValues) {
            newValue = existingValues
              .split(',')
              .filter((val) => val !== facetOption)
              .join(',');
          } else {
            newValue = '';
          }
        }

        if (newValue) {
          params.set(filterKey, newValue);
        }
        navigate({search: params.toString()}, {preventScrollReset: true});
      }
    },
    [navigate, params],
  );

  const handleFacetClick = useCallback(
    (facet: Facet): void => {
      selectedFacet === facet.name
        ? setSelectedFacet(null)
        : setSelectedFacet(facet.name);
    },
    [selectedFacet],
  );

  const clearFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    if (params.has('q')) {
      newParams.set('q', params.get('q') as string);
    }
    params.delete('filters');
    params.delete('group_id');
    navigate({search: newParams.toString()}, {preventScrollReset: true});
  }, [params, navigate]);

  return (
    <ul
      className="lg:bg-initial z-[11] mr-5 flex flex-col flex-wrap gap-x-6 gap-y-2 bg-white px-5 text-[12px] capitalize md:px-10 lg:flex-row lg:items-center lg:p-0"
      ref={facetRef}
    >
      {facets.map((facet) => {
        if (facet.type === 'range') {
          return (
            <RangeFacet
              key={facet.name + '_range'}
              facet={facet}
              selectedFacet={selectedFacet}
              liClassNames={liClassNames}
              handleFacetClick={handleFacetClick}
              params={params}
              setSelectedFacet={setSelectedFacet}
              totalProducts={totalProducts}
              facetFilters={facetFilters}
            />
          );
        } else if (facet.type === 'multiple') {
          return (
            <MultipleFacet
              key={facet.name + '_multiple'}
              facet={facet}
              selectedFacet={selectedFacet}
              liClassNames={liClassNames}
              handleFacetClick={handleFacetClick}
              setSelectedFacet={setSelectedFacet}
              onFacetOptionSelect={onFacetOptionSelect}
              checked={checked}
              totalProducts={totalProducts}
              facetFilters={facetFilters}
            />
          );
        }
      })}
      {/* Clear All Button */}
      <li>
        <ClearButton filters={filters} clearFilters={clearFilters} />
      </li>
    </ul>
  );
}
