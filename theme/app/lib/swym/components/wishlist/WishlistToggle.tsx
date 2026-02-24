import clsx from 'clsx';
import React from 'react';

import {useSwymContext} from '../../context/SwymContext';
import WishlistIcon from './WishlistIcon';

interface WishlistToggleProps {
  className?: string;
  showText?: boolean;
}

/**
 * A component that displays the wishlist icon with a counter
 * Can be used in both desktop and mobile contexts
 */
export default function WishlistToggle({
  className,
  showText = false,
}: WishlistToggleProps) {
  const {wishlist} = useSwymContext();
  const wishlistCount = wishlist?.cnt || 0;

  return (
    <div className={clsx('flex items-center', className)}>
      <div className="relative">
        <WishlistIcon />
        {wishlistCount > 0 && (
          <span
            className={clsx(
              'absolute -right-[7px] -top-[5px] flex aspect-square w-[16px] place-content-center items-center rounded-full border border-secondary bg-secondary fill-secondary pt-px text-2xs font-bold leading-none tracking-normal text-white duration-200',
              'hover:border-opacity-50',
            )}
          >
            {wishlistCount}
          </span>
        )}
      </div>
      {showText && <span className="pl-4 pt-[3px]">My Wishlist</span>}
    </div>
  );
}
