/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-console */
import React, {useContext, useEffect, useRef, useState} from 'react';

import HeroContent from '~/components/heroes/HeroContent';
import {GlobalContext} from '~/lib/utils';

import {useSwymContext} from '../../context/SwymContext';
import EmptyWishlistPage from './EmptyWishlistPage';
import ShareWishlistPopup from './ShareWishlistPopup';
import WishlistItem from './WishlistItem';
import WishlistLoginInfo from './WishlistLoginInfo';

const ITEMS_PER_PAGE = 36;

interface WishlistGridProps {
  isAccountPage?: boolean;
}

const WishlistGrid: React.FC<WishlistGridProps> = ({isAccountPage = false}) => {
  const {wishlist} = useSwymContext();
  const [loading, setLoading] = useState(true);
  const {locale, isAuthenticated} = useContext(GlobalContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isWishlistPublic, setIsWishlistPublic] = useState(false);

  // Mark wishlist as public on load for faster sharing
  useEffect(() => {
    if (wishlist?.lid && isAuthenticated) {
      makeWishlistPublic();
    }
  }, [wishlist?.lid, isAuthenticated]);

  useEffect(() => {
    if (wishlist) {
      setLoading(false);
    }
  }, [wishlist]);

  // Function to mark the wishlist as public
  const makeWishlistPublic = async () => {
    if (!wishlist?.lid) return;

    try {
      const response = await fetch(
        `${locale.pathPrefix}/swym/api/wishlist/public?listId=${wishlist.lid}`,
      );
      const data = await response.json();
      if (
        data &&
        typeof data === 'object' &&
        'success' in data &&
        data.success
      ) {
        setIsWishlistPublic(true);
      }
    } catch (error) {
      console.error('Error marking wishlist as public:', error);
    }
  };

  if (loading) {
    return (
      <div aria-live="polite" className="p-16 text-center">
        Loading your wishlist...
      </div>
    );
  }

  const listCount = wishlist?.listcontents?.length || 0;

  // Calculate the items to display for the current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = wishlist?.listcontents?.slice(startIndex, endIndex);
  if (wishlist?.listcontents?.length !== 0 && paginatedItems?.length === 0) {
    setCurrentPage(currentPage - 1);
  }

  const totalPages = Math.ceil(listCount / ITEMS_PER_PAGE);

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    // Replace smooth scrolling with a more reliable approach for mobile
    window.scrollTo(0, 0);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
      // Replace smooth scrolling with a more reliable approach for mobile
      window.scrollTo(0, 0);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
      // Replace smooth scrolling with a more reliable approach for mobile
      window.scrollTo(0, 0);
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
            } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
            aria-label={`Page ${i}`}
            aria-current={currentPage === i ? 'page' : undefined}
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
          } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
          aria-label="Page 1"
          aria-current={currentPage === 1 ? 'page' : undefined}
        >
          1
        </button>,
      );

      // Show ellipsis if there are hidden pages between the first page and the visible range
      if (currentPage > 3) {
        pagination.push(
          <span key="start-ellipsis" aria-hidden="true">
            ...
          </span>,
        );
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
            } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
            aria-label={`Page ${i}`}
            aria-current={currentPage === i ? 'page' : undefined}
          >
            {i}
          </button>,
        );
      }

      // Show ellipsis if there are hidden pages between the visible range and the last page
      if (currentPage < totalPages - 2) {
        pagination.push(
          <span key="end-ellipsis" aria-hidden="true">
            ...
          </span>,
        );
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
          } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
          aria-label={`Page ${totalPages}`}
          aria-current={currentPage === totalPages ? 'page' : undefined}
        >
          {totalPages}
        </button>,
      );
    }

    return pagination;
  };

  const handleShareWishlist = () => {
    if (!wishlist?.lid) {
      return;
    }

    // No need to call API again since we already made it public on load
    setIsShareModalVisible(true);
  };

  return (
    <div>
      <WishlistLoginInfo />
      {!wishlist ||
      !wishlist?.listcontents ||
      wishlist?.listcontents?.length === 0 ? (
        <EmptyWishlistPage></EmptyWishlistPage>
      ) : (
        <div>
          <div className="flex cursor-pointer justify-between px-1 pb-5">
            <div>
              {isAuthenticated && (
                <div>
                  <button
                    className="flex items-center gap-2 text-[16px]"
                    onClick={handleShareWishlist}
                    aria-label="Share my wishlist"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <mask
                        id="mask0_130_1982"
                        maskUnits="userSpaceOnUse"
                        x="0"
                        y="0"
                        width="24"
                        height="24"
                      >
                        <rect width="24" height="24" fill="#D9D9D9" />
                      </mask>
                      <g mask="url(#mask0_130_1982)">
                        <path
                          d="M6.30775 22.4993C5.80258 22.4993 5.375 22.3243 5.025 21.9743C4.675 21.6243 4.5 21.1967 4.5 20.6915V10.307C4.5 9.80187 4.675 9.37428 5.025 9.02428C5.375 8.67428 5.80258 8.49928 6.30775 8.49928H8.1155C8.32817 8.49928 8.50633 8.57111 8.65 8.71478C8.7935 8.85828 8.86525 9.03645 8.86525 9.24928C8.86525 9.46211 8.7935 9.64028 8.65 9.78378C8.50633 9.92745 8.32817 9.99928 8.1155 9.99928H6.30775C6.23075 9.99928 6.16025 10.0314 6.09625 10.0955C6.03208 10.1595 6 10.23 6 10.307V20.6915C6 20.7685 6.03208 20.839 6.09625 20.903C6.16025 20.9672 6.23075 20.9993 6.30775 20.9993H17.6923C17.7692 20.9993 17.8398 20.9672 17.9038 20.903C17.9679 20.839 18 20.7685 18 20.6915V10.307C18 10.23 17.9679 10.1595 17.9038 10.0955C17.8398 10.0314 17.7692 9.99928 17.6923 9.99928H15.8845C15.6718 9.99928 15.4937 9.92745 15.35 9.78378C15.2065 9.64028 15.1348 9.46211 15.1348 9.24928C15.1348 9.03645 15.2065 8.85828 15.35 8.71478C15.4937 8.57111 15.6718 8.49928 15.8845 8.49928H17.6923C18.1974 8.49928 18.625 8.67428 18.975 9.02428C19.325 9.37428 19.5 9.80187 19.5 10.307V20.6915C19.5 21.1967 19.325 21.6243 18.975 21.9743C18.625 22.3243 18.1974 22.4993 17.6923 22.4993H6.30775ZM11.25 4.71853L9.927 6.04153C9.77817 6.19036 9.60408 6.26378 9.40475 6.26178C9.20542 6.25995 9.02817 6.18145 8.873 6.02628C8.72817 5.87112 8.65317 5.69545 8.648 5.49928C8.643 5.30311 8.718 5.12753 8.873 4.97253L11.3672 2.47828C11.5481 2.29745 11.759 2.20703 12 2.20703C12.241 2.20703 12.4519 2.29745 12.6328 2.47828L15.127 4.97253C15.2653 5.11086 15.3362 5.28228 15.3395 5.48678C15.3427 5.69128 15.2718 5.87112 15.127 6.02628C14.9718 6.18145 14.7936 6.25903 14.5922 6.25903C14.3911 6.25903 14.2129 6.18145 14.0577 6.02628L12.75 4.71853V14.9993C12.75 15.2121 12.6782 15.3903 12.5345 15.5338C12.391 15.6774 12.2128 15.7493 12 15.7493C11.7872 15.7493 11.609 15.6774 11.4655 15.5338C11.3218 15.3903 11.25 15.2121 11.25 14.9993V4.71853Z"
                          fill="#13294E"
                        />
                      </g>
                    </svg>
                    Share my wishlist
                  </button>
                  <ShareWishlistPopup
                    isVisible={isShareModalVisible}
                    onClose={() => setIsShareModalVisible(false)}
                    publicLid={wishlist.lid}
                  />
                </div>
              )}
            </div>
            {listCount > 0 && (
              <div aria-live="polite">
                {listCount} {listCount === 1 ? 'Item' : 'Items'}
              </div>
            )}
          </div>
          <ul
            className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4"
            aria-label="Wishlist items"
          >
            {paginatedItems?.map((item) => (
              <WishlistItem
                key={item.id}
                wishlistItem={item}
                editable={true}
                isAccountPage={isAccountPage}
              ></WishlistItem>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-4 flex items-center justify-center gap-2 pb-10 pt-10"
            >
              {currentPage > 1 && (
                <button
                  onClick={handlePreviousPage}
                  className="bg-gray-200 h-[50px] rotate-180 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Previous page"
                >
                  <svg
                    width="10"
                    height="16"
                    viewBox="0 0 10 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
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
                  className="bg-gray-200 h-[50px] rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Next page"
                >
                  <svg
                    width="10"
                    height="16"
                    viewBox="0 0 10 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M0.603132 15.1004L1.39813 15.8984L9.25063 8.06544L1.39963 0.104938L0.598632 0.893937L7.66363 8.05794L0.603132 15.1004Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </button>
              )}
            </nav>
          )}
        </div>
      )}
    </div>
  );
};

export default WishlistGrid;
