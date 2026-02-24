import {useNavigate, useSearchParams} from '@remix-run/react';
import {useEffect} from 'react';

import {
  DEFAULT_PRODUCT_GRID_NUMBER,
  SECONDARY_PRODUCT_GRID_NUMBER,
  THIRD_PRODUCT_GRID_NUMBER,
} from '~/utils/constants';

type PaginationProps = {
  totalResults: number;
  currentResultsPerPage: number;
  setResultsPerPage: (num: number) => void;
  altGrid?: boolean;
};

export default function ResultsPerPageSelector({
  totalResults,
  currentResultsPerPage,
  setResultsPerPage,
  altGrid,
}: PaginationProps) {
  const navigate = useNavigate();
  let buttons: number[] = [];
  let showAll = false;

  const [searchParams] = useSearchParams();

  // Adjust default numbers if altGrid is true
  const defaultGrid = altGrid
    ? DEFAULT_PRODUCT_GRID_NUMBER + 2
    : DEFAULT_PRODUCT_GRID_NUMBER;
  const secondaryGrid = altGrid
    ? SECONDARY_PRODUCT_GRID_NUMBER + 2
    : SECONDARY_PRODUCT_GRID_NUMBER;
  const thirdGrid = altGrid
    ? THIRD_PRODUCT_GRID_NUMBER + 2
    : THIRD_PRODUCT_GRID_NUMBER;
  useEffect(() => {
    const initialResultsPerPage = searchParams.get('per_page')
      ? Number(searchParams.get('per_page'))
      : null;

    if (initialResultsPerPage) {
      setResultsPerPage(initialResultsPerPage);
    } else if (altGrid) {
      setResultsPerPage(defaultGrid); // Apply +2 if altGrid and no URL param
    }
  }, [searchParams, setResultsPerPage, altGrid, defaultGrid]);

  if (totalResults >= thirdGrid) {
    buttons = [defaultGrid, secondaryGrid, thirdGrid];
  } else if (totalResults >= secondaryGrid - 1) {
    buttons = [defaultGrid, secondaryGrid];
    showAll = true;
  } else if (totalResults >= defaultGrid) {
    buttons = [defaultGrid];
    showAll = true;
  }

  const handleClick = (num: number) => {
    setResultsPerPage(num);
    searchParams.delete('page');
    if (num === defaultGrid) {
      searchParams.delete('per_page');
    } else {
      searchParams.set('per_page', String(num));
    }
    navigate({search: searchParams.toString()}, {preventScrollReset: true});
  };

  return (
    <div className="flex space-x-4">
      {buttons.map((num) =>
        currentResultsPerPage === num ? (
          <span
            key={num}
            className="text-gray-500 whitespace-nowrap font-bold"
            data-count={num}
          >
            {num}
          </span>
        ) : (
          <button
            key={num}
            className="whitespace-nowrap text-blue-600 hover:underline"
            onClick={() => handleClick(num)}
            data-count={num}
          >
            {num}
          </button>
        ),
      )}
      {showAll &&
        (currentResultsPerPage === totalResults ? (
          <span
            className="text-gray-500 whitespace-nowrap"
            data-count={totalResults}
          >
            Show All
          </span>
        ) : (
          <button
            className="whitespace-nowrap text-blue-600 hover:underline"
            onClick={() => handleClick(totalResults)}
            data-count={totalResults}
          >
            Show All
          </button>
        ))}
    </div>
  );
}
