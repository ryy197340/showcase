import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import {useCallback, useEffect} from 'react';
import {useInView} from 'react-intersection-observer';

import {
  NextButton,
  PrevButton,
  usePrevNextButtons,
} from '~/components/modules/EmblaCarouselArrowButtons';
import {Variation} from '~/lib/constructor/types';

type Props = {
  swatches: any;
  boundUpdateVariation: any;
  selectedSwatch: string | undefined;
};

const SLIDES_TO_SCROLL = 4;

const ColorSwatches = ({
  swatches,
  boundUpdateVariation,
  selectedSwatch,
}: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true, // SLIDES_TO_SCROLL prevented poiting the accurate swatch on page load, so we disabled it
  });
  const enableScroll = Object.keys(swatches).length > SLIDES_TO_SCROLL;
  const {prevBtnDisabled, nextBtnDisabled} = usePrevNextButtons(emblaApi);
  const {ref: inViewRef, inView} = useInView({
    triggerOnce: true,
    threshold: 0,
    rootMargin: '422px 0px',
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev(true);
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext(true);
  }, [emblaApi]);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      return;
    }

    emblaRef(node);
    inViewRef(node);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!emblaApi || selectedSwatch === undefined) return;

    const slideIndex = swatches.findIndex(
      (swatch) => Object.keys(swatch)[0] === selectedSwatch,
    );
    if (slideIndex !== -1) {
      emblaApi.scrollTo(1, true);
    }
  }, [selectedSwatch, emblaApi, swatches]);

  useEffect(() => {
    if (!emblaApi || selectedSwatch === undefined) return;
    const slideIndex = swatches.findIndex(
      (swatch) => Object.keys(swatch)[0] === selectedSwatch,
    );
    if (slideIndex !== -1) {
      emblaApi.scrollTo(slideIndex, true);
    }
  }, [selectedSwatch, emblaApi, swatches]);

  return (
    <div className="color-swatches flex min-h-[16px] items-center justify-center">
      {enableScroll && (
        <PrevButton
          className="disabled:opacity-[.3]"
          onClick={scrollPrev}
          disabled={prevBtnDisabled}
        />
      )}

      <div
        className={clsx({
          'mx-1': true,
          'overflow-hidden': true,
          'p-[1px]': true,
          embla: enableScroll,
        })}
        ref={setContainerRef}
        style={{width: `${SLIDES_TO_SCROLL * 36}px`}}
      >
        <div
          className={clsx({
            'flex duration-300': true,
            embla__container: enableScroll,
            'justify-center': Object.keys(swatches).length <= SLIDES_TO_SCROLL,
          })}
        >
          {Object.entries(swatches as Record<string, Variation>).map(
            ([key, variantObj]: [string, Variation], index: number) => {
              const keyName = Object.keys(variantObj)[0];
              const variant = Object.values(variantObj)[0];

              if (!inView) return null;

              return (
                <button
                  className={`p-[4px] ${variant?.shopify_id}`}
                  key={variant?.url || variant?.shopify_id}
                  onClick={() => boundUpdateVariation(keyName, variant)}
                  data-option={keyName}
                  title={keyName}
                >
                  <div
                    className={clsx({
                      'block h-[16px] w-[16px] rounded-full': true,
                      embla__slide:
                        Object.keys(swatches).length > SLIDES_TO_SCROLL,
                    })}
                    aria-label={keyName}
                  >
                    <Image
                      src={variant.swatch_image}
                      alt={keyName}
                      width={24}
                      height={24}
                      loading="lazy"
                      className={clsx({
                        'ring-2 ring-primary ring-offset-2':
                          selectedSwatch === keyName,
                        'block h-full w-full rounded-full': true,
                        'ring-1 ring-neutral-100 ring-offset-0':
                          !variant.swatch_image && selectedSwatch !== keyName,
                      })}
                    />
                  </div>
                </button>
              );
            },
          )}
        </div>
      </div>

      {enableScroll && (
        <NextButton
          className="disabled:opacity-[.3]"
          onClick={scrollNext}
          disabled={nextBtnDisabled}
        />
      )}
    </div>
  );
};

export default ColorSwatches;
