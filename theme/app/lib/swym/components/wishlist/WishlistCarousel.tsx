/* eslint-disable eslint-comments/disable-enable-pair */

import React, {useEffect, useRef, useState} from 'react';

import {useSwymContext} from '../../context/SwymContext';
import WishlistItem from './WishlistItem';

const WishlistCarousel: React.FC = () => {
  const {wishlist} = useSwymContext();
  const [loading, setLoading] = useState(true);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const carouselRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (wishlist) {
      setLoading(false);
    }
  }, [wishlist]);

  useEffect(() => {
    const handleScroll = () => {
      if (carouselRef.current) {
        const {scrollLeft, scrollWidth, clientWidth} = carouselRef.current;
        const tolerance = 2;
        setIsAtStart(Math.abs(scrollLeft) < tolerance);
        setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - tolerance);
      }
    };

    setTimeout(() => {
      const carousel = carouselRef.current;
      if (carousel) {
        carousel.addEventListener('scroll', handleScroll);
        handleScroll(); // Initialize state on mount
      }
    }, 1000);

    return () => {
      setTimeout(() => {
        const carousel = carouselRef.current;
        if (carousel) {
          carousel.removeEventListener('scroll', handleScroll);
        }
      }, 1000);
    };
  }, [carouselRef.current, wishlist?.listcontents.length]);

  if (loading) {
    return '';
  }

  const handleNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: carouselRef.current.offsetWidth,
        behavior: 'smooth',
      });
      setTimeout(() => {
        if (carouselRef.current) {
          const {scrollLeft, scrollWidth, clientWidth} = carouselRef.current;
          const tolerance = 2;
          setIsAtStart(Math.abs(scrollLeft) < tolerance);
          setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - tolerance);
        }
      }, 350);
    }
  };

  const handlePrevious = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: -carouselRef.current.offsetWidth,
        behavior: 'smooth',
      });
      setTimeout(() => {
        if (carouselRef.current) {
          const {scrollLeft, scrollWidth, clientWidth} = carouselRef.current;
          const tolerance = 2;
          setIsAtStart(Math.abs(scrollLeft) < tolerance);
          setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - tolerance);
        }
      }, 350);
    }
  };

  if (
    !wishlist ||
    !wishlist.listcontents ||
    wishlist.listcontents.length === 0
  ) {
    return <div>No items in your wishlist.</div>;
  }

  return (
    <div>
      <div className="relative">
        <button
          onClick={handlePrevious}
          disabled={isAtStart}
          className="absolute left-0 top-1/3 z-10 -translate-y-1/2 bg-[#F2F3F5] p-2 shadow disabled:opacity-[.3]"
          aria-label="Previous"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <ul
          ref={carouselRef}
          className="swym-h-hide-scrollbar flex gap-4 overflow-x-scroll scroll-smooth pb-4"
        >
          {wishlist.listcontents.map((item) => (
            <WishlistItem
              key={item.id}
              type="carousel-item"
              wishlistItem={item}
              editable={true}
            />
          ))}
        </ul>
        <button
          onClick={handleNext}
          disabled={isAtEnd}
          className="absolute right-0 top-1/3 z-10 -translate-y-1/2 bg-[#F2F3F5] p-2 shadow disabled:opacity-[.3]"
          aria-label="Next"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WishlistCarousel;
