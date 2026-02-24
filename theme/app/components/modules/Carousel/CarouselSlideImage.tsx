import {memo, useEffect, useState} from 'react';

import SanityImage from '~/components/media/SanityImage';
import {ImageAndMobile} from '~/lib/sanity';

type Props = {
  img: ImageAndMobile;
  index: number;
  dataset: string;
  projectID: string;
};

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

const CarouselSlideImage = ({img, index, dataset, projectID}: Props) => {
  const isMobile = useIsMobile();

  if (img.slideImages) {
    const imageRef = isMobile
      ? img.slideImages.mobileImage?.asset?._ref
      : img.slideImages.image?.asset?._ref;

    if (!imageRef) return null;

    return (
      <picture className="flex h-full w-full">
        <SanityImage
          alt={img.slideImages?.altText}
          src={imageRef}
          dataset={dataset}
          objectFit="cover"
          layout="fill"
          projectId={projectID}
          loading={index === 0 ? 'eager' : 'lazy'}
        />
      </picture>
    );
  }
  return null;
};

export default memo(CarouselSlideImage);
