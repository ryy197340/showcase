import {memo} from 'react';

import {MultiplesFacet} from '~/lib/constructor/types';
import {returnFacetName} from '~/lib/utils';

import CloseIcon from '../icons/Close';
import {FacetCaret} from '../icons/FacetCaret';
import ColorFacet from './ColorFacet';
import FacetCheckbox from './FacetCheckbox';
import SizeFacets from './SizeFacets';

type Props = {
  facet: MultiplesFacet;
  selectedFacet: string | null;
  liClassNames: string;
  handleFacetClick: (facet: MultiplesFacet) => void;
  setSelectedFacet: (facet: string | null) => void;
  onFacetOptionSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  checked: Record<string, boolean>;
  totalProducts: number;
  facetFilters: Record<string, string[]>;
};

function MultipleFacet({
  facet,
  selectedFacet,
  liClassNames,
  handleFacetClick,
  setSelectedFacet,
  onFacetOptionSelect,
  checked,
  totalProducts,
  facetFilters,
}: Props) {
  let classes =
    'h-fit w-full border-b-2 border-b-lightGray bg-white lg:absolute lg:bottom-0 lg:left-0 lg:top-full lg:px-10 lg:pb-5 justify-items-start';
  const getFacetClassNames = () => {
    if (selectedFacet === facet.name) {
      const optionsLength = facet.options.length;
      if (facet.name === 'categories') {
        // If in categories facet, initialize classes with grid rows
        classes += ' grid gap-2 lg:gap-4';
        // Determine grid rows based on facet options length to control vertical stacking
        if (optionsLength <= 6) {
          classes += ' grid-rows-6'; // Define a 6-row grid if options <= 6
        } else if (optionsLength <= 10) {
          classes += ' grid-rows-6 lg:grid-rows-3 grid-flow-col';
        } else if (optionsLength <= 14) {
          classes += ' grid-rows-8 lg:grid-rows-4 grid-flow-col';
        } else if (optionsLength <= 18) {
          classes +=
            ' grid-rows-[repeat(10,_minmax(0,1fr))] lg:grid-rows-5 grid-flow-col';
        } else if (optionsLength <= 22) {
          classes +=
            ' grid-rows-[repeat(12,_minmax(0,1fr))] lg:grid-rows-6 grid-flow-col';
        } else if (optionsLength <= 26) {
          classes +=
            ' grid-rows-[repeat(14,_minmax(0,1fr))] lg:grid-rows-7 grid-flow-col';
        } else if (optionsLength <= 30) {
          classes +=
            ' grid-rows-[repeat(16,_minmax(0,1fr))] lg:grid-rows-8 grid-flow-col';
        } else {
          classes +=
            ' grid-rows-[repeat(18,_minmax(0,_1fr)] lg:grid-rows-9 grid-flow-col';
        }
      } else {
        // If not in categories facet, initialize classes first with grid columns instead)
        classes += ` grid auto-cols-max auto-rows-max gap-2 lg:gap-4`;

        // Determine grid columns based on facet options length
        if (['size', 'sizes'].includes(facet.name) || optionsLength <= 6) {
          classes += ' grid-cols-1';
        } else if (optionsLength <= 12) {
          classes += ' grid-cols-2 lg:grid-cols-2';
        } else if (optionsLength <= 18) {
          classes += ' grid-cols-2 lg:grid-cols-3';
        } else if (optionsLength <= 24) {
          classes += ' grid-cols-2 lg:grid-cols-4';
        } else if (optionsLength <= 30) {
          classes += ' grid-cols-2 lg:grid-cols-5';
        } else {
          classes += ' grid-cols-2 lg:grid-cols-6';
        }
      }
    } else {
      classes += ' hidden';
    }

    return classes;
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
        {returnFacetName(facet, facetFilters)}
        <div
          className="transition-transform duration-300"
          style={{
            transform: selectedFacet === facet.name ? 'rotate(180deg)' : '',
          }}
        >
          <FacetCaret />
        </div>
      </button>
      <fieldset>
        <legend
          id={`legend-${facet.name}`}
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: '0',
          }}
        >
          Product Filters - {facet.display_name}
        </legend>
        <ul
          id={`facetList-${facet.name}`}
          className={getFacetClassNames()}
          aria-labelledby={`legend-${facet.name}`}
        >
          <button
            className="absolute right-0 top-0 mx-10 my-2 hidden opacity-75 lg:block"
            onClick={() => setSelectedFacet(null)}
          >
            <CloseIcon />
          </button>
          {['size', 'sizes'].includes(facet.name) ? (
            <li className="flex items-center whitespace-nowrap leading-[2] md:mr-[30px]">
              <SizeFacets
                facet={facet}
                checked={checked}
                onFacetOptionSelect={onFacetOptionSelect}
              />
            </li>
          ) : (
            facet.options.map((option, index) => (
              <li
                className={`flex items-center leading-[2] hover:underline ${
                  ['color', 'colors'].includes(facet.name) ? 'rounded-full' : ''
                }`}
                // eslint-disable-next-line react/no-array-index-key
                key={`${option.display_name}-${index}`}
              >
                {['color', 'colors'].includes(facet.name) ? (
                  <ColorFacet
                    option={option}
                    facet={facet}
                    onFacetOptionSelect={onFacetOptionSelect}
                    checked={checked}
                    facetFilters={facetFilters}
                  />
                ) : (
                  <FacetCheckbox
                    facet={facet}
                    option={option}
                    onFacetOptionSelect={onFacetOptionSelect}
                    checked={checked}
                  />
                )}
              </li>
            ))
          )}
          <li className="totalResults col-span-full mt-4 flex w-full justify-start pt-2 text-darkGray">
            <span>{totalProducts} items available</span>
          </li>
        </ul>
      </fieldset>
    </li>
  );
}

export default memo(MultipleFacet);
