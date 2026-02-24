import {useMatches} from '@remix-run/react';
import {memo} from 'react';

import SanityImage from '~/components/media/SanityImage';
import {Slide} from '~/lib/sanity/types';

import {Link} from '../../Link';
import CarouselSlideContent from './CarouselSlideContent';
import CarouselSlideImage from './CarouselSlideImage';

type Props = {
  slide: Slide;
  index: number;
};

const CarouselSlide = ({slide, index}: Props) => {
  const [root] = useMatches();
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;

  const newSlide = (
    <div
      className={`embla__slide__img relative flex h-full min-h-[675px] w-full flex-col object-cover md:flex-row lg:min-h-[770px]`}
    >
      {slide.html ? (
        <CarouselSlideContent slide={slide} index={index} />
      ) : (
        // images/colors in slides
        slide.images?.map((img, indice) => {
          // color background
          if (img._type === 'color') {
            return (
              <div
                key={img._key}
                className={`relative h-full ${
                  slide.images?.length === 1
                    ? 'w-full'
                    : slide.contentSlide === indice
                    ? 'w-full md:w-1/2'
                    : 'md:block md:w-1/2'
                }`}
                style={{backgroundColor: img.hex}}
              >
                {slide.contentSlide === indice && (
                  <CarouselSlideContent slide={slide} index={index} />
                )}
              </div>
            );
          } else if (img._type === 'slideImage') {
            // images
            return (
              <div
                className={`relative h-full ${
                  slide.images?.length === 1
                    ? 'w-full'
                    : slide.contentSlide === indice
                    ? 'w-full md:w-1/2'
                    : 'md:block md:w-1/2'
                }`}
                key={img._key}
              >
                {img.slideImages ? (
                  <CarouselSlideImage
                    img={img}
                    index={index}
                    dataset={sanityDataset}
                    projectID={sanityProjectID}
                  />
                ) : img.image ? (
                  <SanityImage
                    alt={img.image?.altText}
                    crop={img.image?.crop}
                    dataset={sanityDataset}
                    hotspot={img.image?.hotspot}
                    layout="fill"
                    objectFit="cover"
                    projectId={sanityProjectID}
                    sizes="100vw"
                    src={img.image?.asset?._ref}
                  />
                ) : img.mobileImage ? (
                  <SanityImage
                    alt={img.mobileImage?.altText}
                    crop={img.mobileImage?.crop}
                    dataset={sanityDataset}
                    hotspot={img.mobileImage?.hotspot}
                    layout="fill"
                    objectFit="cover"
                    projectId={sanityProjectID}
                    sizes="100vw"
                    src={img.mobileImage?.asset?._ref}
                  />
                ) : null}
                {slide.contentSlide === indice && (
                  <CarouselSlideContent slide={slide} index={index} />
                )}
              </div>
            );
          }
          return null;
        })
      )}
    </div>
  );
  if (slide.link && slide.link.slug) {
    return (
      <Link to={slide.link.slug} prefetch="intent">
        {newSlide}
      </Link>
    );
  }
  return newSlide;
};

export default memo(CarouselSlide);
