import {NavigateFunction} from '@remix-run/react';
import {useCallback, useEffect, useMemo, useState} from 'react';

import {toPageNumber} from '~/utils';

import PaginationArrowIcon from '../icons/PaginationArrow';

type Props = {
  resultsPerPage: number;
  totalResults: number;
  resultsPage: number;
  setResultsPage: (resultsPage: number) => void;
  navigate?: NavigateFunction;
  searchParams?: URLSearchParams;
};

const MAX_VISIBLE_PAGES = 5;

export default function ResultsPagination({
  resultsPerPage,
  totalResults,
  resultsPage,
  setResultsPage,
  navigate,
  searchParams,
}: Props) {
  const totalPages = useMemo(
    () => Math.ceil(totalResults / resultsPerPage),
    [totalResults, resultsPerPage],
  );
  const [startPage, setStartPage] = useState(1);

  const handlePageChange = useCallback(
    (pageNumber: number) => {
      if (navigate && searchParams) {
        const newParams = new URLSearchParams(searchParams);
        if (pageNumber !== 1) {
          newParams.set('page', toPageNumber(pageNumber, String) as string);
        } else {
          newParams.delete('page');
        }
        navigate({search: newParams.toString()});
      } else {
        setResultsPage(pageNumber);
      }
      window.scrollTo({top: 0, behavior: 'smooth'});
    },
    [navigate, searchParams, setResultsPage],
  );

  const handlePrevious = () => {
    setStartPage(Math.max(1, startPage - MAX_VISIBLE_PAGES));
  };

  const handleNext = () => {
    setStartPage(
      Math.min(
        totalPages - MAX_VISIBLE_PAGES + 1,
        startPage + MAX_VISIBLE_PAGES,
      ),
    );
  };

  // Initialize startPage based on resultsPage on page load
  useEffect(() => {
    const newStartPage = Math.max(
      1,
      Math.ceil(resultsPage / MAX_VISIBLE_PAGES) * MAX_VISIBLE_PAGES -
        MAX_VISIBLE_PAGES +
        1,
    );
    setStartPage(newStartPage);
  }, [resultsPage]);
  const buttonStyles = 'h-[50px] w-[54px] border border-lineGray text-xs';

  const generatePageNumbers = useMemo(() => {
    const pages = [];
    const endPage = Math.min(startPage + MAX_VISIBLE_PAGES - 1, totalPages);
    // Display the first page button followed by ellipsis if the first page isn't visible
    if (startPage > 2) {
      pages.push(
        <button
          key="1"
          onClick={() => handlePageChange(1)}
          className={buttonStyles}
        >
          1
        </button>,
      );
      pages.push(<span key="startEllipsis">...</span>);
    } else if (startPage === 2) {
      pages.push(
        <button key="1" onClick={() => handlePageChange(1)}>
          1
        </button>,
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`${
            resultsPage === i
              ? 'border border-solid border-primary'
              : 'bg-white text-black'
          } ${buttonStyles}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>,
      );
    }

    // Display ellipsis if the last page isn't visible, followed by the last page button
    if (endPage < totalPages - 1) {
      pages.push(<span key="endEllipsis">...</span>);
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={buttonStyles}
        >
          {totalPages}
        </button>,
      );
    } else if (endPage === totalPages - 1) {
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={buttonStyles}
        >
          {totalPages}
        </button>,
      );
    }

    return pages;
  }, [startPage, totalPages, handlePageChange, resultsPage]);
  return totalPages > 1 ? (
    <div className="mt-14 flex items-center justify-center gap-[10px] px-5 md:mt-16">
      {startPage > 1 && (
        <button onClick={handlePrevious} className="rotate-180">
          <PaginationArrowIcon />
        </button>
      )}
      {generatePageNumbers}
      {startPage + MAX_VISIBLE_PAGES - 1 < totalPages && (
        <button onClick={handleNext}>
          <PaginationArrowIcon />
        </button>
      )}
    </div>
  ) : (
    ''
  );
}
