import {useLoaderData} from '@remix-run/react';
import React, {useEffect, useState} from 'react';

import HeroContent from '~/components/heroes/HeroContent';

import EmptyWishlistPage from './EmptyWishlistPage';
import WishlistItem from './WishlistItem';

const ShareWishlistPage: React.FC = () => {
  const ITEMS_PER_PAGE = 36;

  const {data}: any = useLoaderData();
  const wishlist = data;
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (wishlist) {
      setLoading(false);
    }
  }, [wishlist]);

  if (loading) {
    return '';
  }

  const listCount = wishlist?.listcontents?.length || 0;

  // Calculate the items to display for the current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = wishlist?.listcontents?.slice(startIndex, endIndex);

  const totalPages = Math.ceil(listCount / ITEMS_PER_PAGE);

  const wishlistUserName = wishlist?.userinfo?.fname || null;

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  const renderPagination = () => {
    const pagination = [];
    const maxVisiblePages = 3; // Maximum number of visible pages (including first and last)

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than or equal to maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pagination.push(
          <button
            key={i}
            onClick={() => handlePageClick(i)}
            className={`h-[50px] w-[54px] border text-xs ${
              currentPage === i
                ? 'border-solid border-primary'
                : 'border-lineGray'
            }`}
          >
            {i}
          </button>,
        );
      }
    } else {
      // Always show the first page
      pagination.push(
        <button
          key="first"
          onClick={() => handlePageClick(1)}
          className={`h-[50px] w-[54px] border text-xs ${
            currentPage === 1
              ? 'border-solid border-primary'
              : 'border-lineGray'
          }`}
        >
          1
        </button>,
      );

      // Show ellipsis if there are hidden pages between the first page and the visible range
      if (currentPage > 3) {
        pagination.push(<span key="start-ellipsis">...</span>);
      }

      // Show pages around the current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pagination.push(
          <button
            key={i}
            onClick={() => handlePageClick(i)}
            className={`h-[50px] w-[54px] border text-xs ${
              currentPage === i
                ? 'border-solid border-primary'
                : 'border-lineGray'
            }`}
          >
            {i}
          </button>,
        );
      }

      // Show ellipsis if there are hidden pages between the visible range and the last page
      if (currentPage < totalPages - 2) {
        pagination.push(<span key="end-ellipsis">...</span>);
      }

      // Always show the last page
      pagination.push(
        <button
          key="last"
          onClick={() => handlePageClick(totalPages)}
          className={`h-[50px] w-[54px] border text-xs ${
            currentPage === totalPages
              ? 'border-solid border-primary'
              : 'border-lineGray'
          }`}
        >
          {totalPages}
        </button>,
      );
    }

    return pagination;
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-center text-[34px] capitalize">
        {wishlistUserName ? wishlistUserName + "'s " : 'My '}Wishlist
      </h2>
      {!wishlist ||
      !wishlist?.listcontents ||
      wishlist?.listcontents?.length === 0 ? (
        <EmptyWishlistPage></EmptyWishlistPage>
      ) : (
        <div>
          <div className="flex cursor-pointer flex-wrap justify-between gap-3 pb-5">
            {!wishlistUserName && wishlist?.userinfo?.em && (
              <div>
                <div>Sending you some of my favorites!</div>
                <div className="mt-2">
                  From{' '}
                  <span className="font-bold">{wishlist.userinfo?.em}</span>
                </div>
              </div>
            )}
            {listCount && (
              <div className="flex-grow text-right">
                {listCount} {listCount === 1 ? 'Item' : 'Items'}
              </div>
            )}
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paginatedItems?.map((item: WishlistItem) => (
              <WishlistItem key={item.id} wishlistItem={item}></WishlistItem>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-center gap-2 pb-10 pt-10">
            {currentPage > 1 && (
              <button
                onClick={handlePreviousPage}
                className="bg-gray-200 h-[50px] rotate-180 rounded px-2 py-2"
              >
                <svg
                  width="10"
                  height="16"
                  viewBox="0 0 10 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.603132 15.1004L1.39813 15.8984L9.25063 8.06544L1.39963 0.104938L0.598632 0.893937L7.66363 8.05794L0.603132 15.1004Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
            )}
            {renderPagination()}
            {currentPage < totalPages && (
              <button
                onClick={handleNextPage}
                className="bg-gray-200 h-[50px] rounded px-2 py-2"
              >
                <svg
                  width="10"
                  height="16"
                  viewBox="0 0 10 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.603132 15.1004L1.39813 15.8984L9.25063 8.06544L1.39963 0.104938L0.598632 0.893937L7.66363 8.05794L0.603132 15.1004Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareWishlistPage;
