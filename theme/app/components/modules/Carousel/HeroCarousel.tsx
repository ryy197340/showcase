import {memo} from 'react';

import {Carousel} from '~/lib/sanity';

import BannerCarousel from './BannerCarousel';

type Props = {
  content: Carousel;
};

const HeroCarousel = ({content}: Props) => {
  return (
    <div className="h-full w-full">
      <BannerCarousel content={content} />
    </div>
  );
};

export default memo(HeroCarousel);
