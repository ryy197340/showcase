import React, {useContext} from 'react';

import HeroContent from '~/components/heroes/HeroContent';
import {GlobalContext} from '~/lib/utils';

import WishlistLoginInfo from './WishlistLoginInfo';

const EmptyWishlistPage: React.FC = () => {
  const {isAuthenticated} = useContext(GlobalContext);
  return (
    <div className="pb-4 pt-4">
      <div className="flex flex-col justify-center text-center">
        <div className="m-auto max-w-md leading-[130%]">
          Discover some of our bestsellers below for inspiration, or simply
          click the heart icon as you browse to add items to your list.
        </div>
      </div>
    </div>
  );
};

export default EmptyWishlistPage;
