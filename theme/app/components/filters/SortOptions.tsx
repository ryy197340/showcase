import clsx from 'clsx';
import {ChangeEvent} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';

import {SortOption} from '~/lib/constructor/types';

type Props = {
  sortOptions: SortOption[];
};

export default function SortOptions({sortOptions}: Props) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const selectedSort = `${params.get('sort_by')}_${params.get('sort_order')}`;

  const onChangeSorting = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedItem = sortOptions.find(
      (item) => item.id === event.target.value,
    );

    if (selectedItem) {
      params.set('sort_by', selectedItem.sort_by);
      params.set('sort_order', selectedItem.sort_order);
    }

    navigate({search: params.toString()}, {preventScrollReset: true});
  };

  if (sortOptions?.length > 0) {
    return (
      <select
        className={clsx(
          'cursor-pointer p-2 outline-none',
          selectedSort === 'null_null' && 'w-16',
          selectedSort !== 'null_null' && 'w-1/2 sm:w-auto',
        )}
        onChange={onChangeSorting}
        value={selectedSort === 'null_null' ? '' : selectedSort}
      >
        {selectedSort === 'null_null' && (
          <option value="" disabled={true} hidden={true}>
            Sort
          </option>
        )}
        {sortOptions.map((sortOption, i) => (
          <option key={sortOption.id + `_${i}`} value={sortOption.id}>
            {sortOption.display_name}
          </option>
        ))}
      </select>
    );
  }
  return null;
}
