// import for embla carousel
import {EmblaOptionsType} from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import {useEffect, useState} from 'react';

import {CompleteTheLookRow as CompleteTheLookRowType} from '~/lib/sanity';
import {hexToRgba} from '~/utils/styleHelpers';

import CompleteTheLook from './CompleteTheLook';
import {DotButton, useDotButton} from './EmblaCarouselDotButton';

type Props = {
  module: CompleteTheLookRowType;
  options: EmblaOptionsType;
};

function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < breakpoint);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [breakpoint]);
  return isMobile;
}

export default function CompleteTheLookRow({module, options}: Props) {
  const {content = [], groupTitle, colorTheme} = module;

  const isMobile = useIsMobile();
  const hasVariant2 = content.some((look) => look.variant === 'variant 2');

  const widthClass = hasVariant2
    ? 'w-3/4'
    : content.length > 1
    ? 'w-full'
    : 'w-1/3';

  // mobile carousel slides
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const {selectedIndex, scrollSnaps, onDotButtonClick} = useDotButton(emblaApi);

  return (
    <div
      className={`complete-the-look-row ${colorTheme ? 'md:pb-4' : ''}`}
      style={
        colorTheme
          ? {
              backgroundColor: hexToRgba(colorTheme.background),
            }
          : undefined
      }
    >
      {groupTitle && (
        <h2
          className={`w-full text-center font-hoefler text-[24px] md:pb-4 md:pt-4 ${
            colorTheme ? 'pt-4' : ''
          }`}
          style={colorTheme ? {color: colorTheme.text} : undefined}
        >
          {groupTitle}
        </h2>
      )}

      {isMobile && !hasVariant2 && (
        <section className={`embla ${colorTheme ? 'py-4' : 'py-0'}`}>
          <div className="embla__viewport" ref={emblaRef}>
            <div className="page-width embla__container flex flex-row">
              {content.length > 0 &&
                content.map((singleLook, index) => (
                  <div
                    className="embla__slide relative basis-full"
                    key={singleLook._key}
                  >
                    <CompleteTheLook
                      key={singleLook._key}
                      module={singleLook}
                      parentColorTheme={colorTheme}
                    />
                  </div>
                ))}
            </div>
            {content.length > 1 && (
              <div className="relative mt-4 flex justify-center gap-2">
                {scrollSnaps?.map((_, index) => {
                  return (
                    <DotButton
                      // eslint-disable-next-line react/no-array-index-key
                      key={`dot-${index}`}
                      selected={index === selectedIndex}
                      index={index}
                      onDotButtonClick={onDotButtonClick}
                      className={`h-2 w-2 rounded-full ${
                        index === selectedIndex ? 'bg-darkGray' : 'bg-gray'
                      } transition-colors duration-300`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
      {isMobile && hasVariant2 && (
        <div className="page-width mx-auto">
          {content.length > 0 &&
            content.map((singleLook) => (
              <div className="relative w-full" key={singleLook._key}>
                <CompleteTheLook
                  key={singleLook._key}
                  module={singleLook}
                  parentColorTheme={colorTheme}
                />
              </div>
            ))}
        </div>
      )}
      {!isMobile && (
        <div className={`page-width mx-auto flex flex-row ${widthClass}`}>
          {content.length > 0 &&
            content.map((singleLook) => (
              <div className="relative w-full md:mx-4" key={singleLook._key}>
                <CompleteTheLook
                  key={singleLook._key}
                  module={singleLook}
                  parentColorTheme={colorTheme}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
