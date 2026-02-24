/* eslint-disable eslint-comments/disable-enable-pair */

import React from 'react';

import HeroContent from '~/components/heroes/HeroContent';

import WishlistGrid from './WishlistGrid';

const WishlistPage: React.FC = () => {
  return (
    <div className="py-4">
      <h2 className="mb-4 text-center text-[34px]">My Wishlist</h2>
      <WishlistGrid isAccountPage={false} />
      <div className="page-width px-5 md:px-0">
        <HeroContent
          content={{
            _type: 'module.podSlider',
            heading: {
              heading: 'test',
              desktopAlignment: 'center',
              mobileAlignment: 'center',
            },
            displayOptions: {
              cardsVisible: 'fewer',
              showColorSwatches: false,
            },
            pod: {
              categoryID: undefined,
              itemID: undefined,
              numberOfProducts: 12,
              podId: 'home-page',
            },
            _key: 'best-sellers',
          }}
        />
      </div>
    </div>
  );
};

export default WishlistPage;
