import {EmblaCarouselType, EmblaOptionsType} from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import {memo, useCallback, useMemo} from 'react';

import {useHydration} from '~/hooks/useHydration';
import {Carousel} from '~/lib/sanity';

import {useDotButton} from '../EmblaCarouselDotButton';
import BannerCarouselSSR from './BannerCarouselSSR';
import CarouselSlide from './CarouselSlide';
import DotButton from './DotButton';

type Props = {
  content: Carousel;
};

const BannerCarouselComponent = ({content}: Props) => {
  const {slides} = content;
  const options: EmblaOptionsType = useMemo(
    () => ({align: 'start', loop: true}),
    [],
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [
    Autoplay({stopOnInteraction: false, delay: content.interval * 1000}),
  ]);
  const onButtonClick = useCallback((emblaApi: EmblaCarouselType) => {
    const {autoplay} = emblaApi.plugins();
    if (!autoplay) return;
    if (autoplay.options.stopOnInteraction !== false) autoplay.stop();
  }, []);

  const {selectedIndex, scrollSnaps, onDotButtonClick} = useDotButton(
    emblaApi,
    onButtonClick,
  );

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onDotButtonClick(index);
    }
  };

  return (
    <div className="flex flex-col gap-[6px]">
      <div
        className="embla__viewport overflow-hidden"
        ref={emblaRef}
        style={{maxHeight: content.carouselHeight}}
      >
        <div className="embla__container flex touch-pan-y">
          {/* slides */}
          {slides?.map((slide, index) => (
            <div className="embla__slide relative basis-full" key={slide._key}>
              <CarouselSlide slide={slide} index={index} />
            </div>
          ))}
        </div>
      </div>
      {/* buttons */}
      {slides?.length > 1 && (
        <div className="mt-5 flex flex-row items-center justify-center gap-[6px]">
          {scrollSnaps?.map((_, index) => {
            return (
              <DotButton
                // eslint-disable-next-line react/no-array-index-key
                key={`dot-${index}`}
                selected={index === selectedIndex}
                index={index}
                onDotButtonClick={onDotButtonClick}
                handleKeyDown={handleKeyDown}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const BannerCarouselCSR = memo(BannerCarouselComponent);

export default function BannerCarousel(props: any) {
  const isHydrated = useHydration();
  return (
    <>
      {isHydrated ? (
        <BannerCarouselCSR {...props} />
      ) : (
        <BannerCarouselSSR {...props} />
      )}
    </>
  );
}
