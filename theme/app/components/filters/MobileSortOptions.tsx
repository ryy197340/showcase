import React from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';

import {SortOption} from '~/lib/constructor/types';

import CloseIcon from '../icons/Close';

type MobileSortOptionsProps = {
  sortOptions: SortOption[];
  mobileSortOptionIsOpen: boolean;
  toggleMobileSortOption: () => void;
};

const MobileSortOptions: React.FC<MobileSortOptionsProps> = ({
  sortOptions,
  mobileSortOptionIsOpen,
  toggleMobileSortOption,
}) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const selectedSort = `${params.get('sort_by')}_${params.get('sort_order')}`;

  const onChangeSorting = (selectedItem: SortOption) => {
    params.set('sort_by', selectedItem.sort_by);
    params.set('sort_order', selectedItem.sort_order);
    navigate({search: params.toString()}, {preventScrollReset: true});
  };

  return (
    <>
      {!!sortOptions?.length && (
        <>
          <div className="relative block border-b-2 border-b-lightGray px-4 py-6 lg:hidden">
            <p className="text-center text-[16px] font-bold uppercase">Sort</p>
            <button
              onClick={toggleMobileSortOption}
              className="absolute right-0 top-1/2 my-auto mr-[20px] -translate-y-1/2 transform opacity-75"
            >
              <CloseIcon />
            </button>
          </div>
          {mobileSortOptionIsOpen && (
            <div className="mt-2 px-4 pb-4">
              {sortOptions.map((sortOption) => (
                <div key={sortOption.id} className="flex items-center py-2">
                  <input
                    type="radio"
                    id={`mobileSortOption_${sortOption.id}`}
                    name="mobileSortOption"
                    value={sortOption.id}
                    checked={selectedSort === sortOption.id}
                    onChange={() => onChangeSorting(sortOption)}
                  />
                  <label
                    htmlFor={`mobileSortOption_${sortOption.id}`}
                    className="ml-2"
                  >
                    {sortOption.display_name}
                  </label>
                </div>
              ))}
              <div className="mt-4 px-4 text-center">
                <button
                  className="min-h-[50px] w-full bg-secondary px-3 text-xs text-white placeholder-darkGray"
                  onClick={toggleMobileSortOption}
                  type="button"
                  aria-label="apply"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default MobileSortOptions;
