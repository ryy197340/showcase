import {SetStateAction, useCallback, useEffect, useRef, useState} from 'react';

import {Slide} from '~/lib/sanity';

import Link from '../elements/Link';
import DotIcon from '../icons/Dot';

type Props = {
  slides: Slide[];
  interval: number;
};

export default function Slider({slides, interval}: Props) {
  const timerRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const goToNext = useCallback(() => {
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, slides]);

  const goToSlide = (slideIndex: SetStateAction<number>) => {
    setCurrentIndex(slideIndex);
  };

  // auto-scroll
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      goToNext();
    }, interval * 1000);
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 500);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [goToNext, interval]);
  // slides
  const slideBackground = (index: number) => {
    const slideImage = currentSlide.images[index];
    if (slideImage._type === 'slideImage') {
      if (isMobile) {
        return slideImage.slideImages.mobileImage
          ? {backgroundImage: `url(${slideImage.slideImages.mobileImage.url})`}
          : {backgroundImage: `url(${slideImage.slideImages.image.url})`};
      } else {
        return {backgroundImage: `url(${slideImage.slideImages.image.url})`};
      }
    }
    if (slideImage._type === 'color') return {background: slideImage.hex};
  };
  const currentSlide = slides[currentIndex];
  const currentImages = currentSlide.images;
  const slideStyles = (index: number) => {
    return `flex h-full min-h-[675px] flex-col items-center justify-${verticalOrientation()} gap-[20px] change text-center py-[100px] lg:py-[200px] ${
      currentImages.length === 1
        ? 'w-full bg-center px-[40px]'
        : index === currentSlide.contentSlide
        ? 'w-full bg-top lg:w-1/2 lg:bg-center px-[40px]'
        : 'w-0 bg-center lg:w-1/2'
    } bg-cover lg:min-h-[770px]`;
  };
  const verticalOrientation = () => {
    return currentSlide.verticalOrientation == 'top'
      ? 'start'
      : currentSlide.verticalOrientation == 'middle'
      ? 'center'
      : currentSlide.verticalOrientation === 'bottom'
      ? 'end'
      : 'center';
  };
  const slideTextColor = () =>
    currentSlide.textColor.hex ? currentSlide.textColor.hex : '000000';

  // dots
  const dotStyling = (slideIndex: number) =>
    `flex cursor-pointer justify-center text-${[
      slideIndex === currentIndex ? 'activeSlideButton' : 'slideButton',
    ]}`;
  const dotColor = (slideIndex: number) => {
    return slideIndex === currentIndex ? 'A9A9A9' : 'D9D9D9';
  };
  // content
  const returnAdditionalText = (index: number) => {
    if (
      (currentImages.length === 1 || index == currentSlide.contentSlide) &&
      currentSlide.additionalText
    )
      return (
        <span
          className={`font-gotham text-sm leading-[20px] sm:whitespace-pre-wrap`}
          style={{color: slideTextColor()}}
        >
          {currentSlide.additionalText[0].children[0].text}
        </span>
      );
    return null;
  };

  const returnContent = (
    index: number,
    content: any,
    node: React.ReactNode,
  ) => {
    if (
      (currentImages.length === 1 || index === currentSlide.contentSlide) &&
      content
    )
      return node;
  };
  const slideButtonStyles = `mt-5 sm:mt-0 after:bg-white button-link-border-b`;
  const renderSlides = () => (
    <div className="flex flex-row">
      {currentImages.map((slideImage, index) => (
        <div
          key={slideImage._key}
          className={slideStyles(index)}
          style={slideBackground(index)}
        >
          {/* subHeading */}
          {returnContent(
            index,
            currentSlide.subHeading,
            <span
              className={`text-2xs font-semibold uppercase tracking-[1px]`}
              style={{color: slideTextColor()}}
            >
              {currentSlide.subHeading}
            </span>,
          )}
          {/* heading */}
          {returnContent(
            index,
            currentSlide.heading[0].children[0].text,
            <h2
              className={`font-hoefler text-[40px] sm:whitespace-pre sm:text-[44px]`}
              style={{color: slideTextColor()}}
            >
              {currentSlide.heading[0].children[0].text}
            </h2>,
          )}
          {/* additional text */}
          {returnAdditionalText(index)}
          {/* link button */}
          {returnContent(
            index,
            currentSlide.link.title,
            <span
              className={slideButtonStyles}
              style={{color: slideTextColor()}}
            >
              {currentSlide.link.title}
            </span>,
          )}
        </div>
      ))}
    </div>
  );
  const renderDots = () => {
    return (
      slides.length > 1 && (
        <div className="mt-[18px] flex justify-center gap-[6px]">
          {slides.map((slide, slideIndex) => (
            <div
              key={slide._key}
              className={dotStyling(slideIndex)}
              onClick={() => goToSlide(slideIndex)}
              onKeyDown={() => goToSlide(slideIndex)}
              role="button"
              tabIndex={slideIndex}
            >
              <DotIcon color={dotColor(slideIndex)} />
            </div>
          ))}
        </div>
      )
    );
  };

  return (
    <div className="relative h-full w-full">
      {currentSlide.link.slug ? (
        <Link link={currentSlide.link}>{renderSlides()}</Link>
      ) : (
        renderSlides()
      )}
      {renderDots()}
    </div>
  );
}
