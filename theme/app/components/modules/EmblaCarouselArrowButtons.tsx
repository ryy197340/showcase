import {EmblaCarouselType} from 'embla-carousel';
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';

type UsePrevNextButtonsType = {
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
};

export const usePrevNextButtons = (
  emblaApi: EmblaCarouselType | undefined,
): UsePrevNextButtonsType => {
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const onPrevButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const onNextButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);

    return () => {
      if (!emblaApi) {
        return;
      }
      emblaApi.off('reInit', onSelect);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  };
};

type PropType = PropsWithChildren<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
>;

export const PrevButton: React.FC<PropType> = (props) => {
  const {children, ...restProps} = props;

  return (
    <button
      className="embla__button embla__button--prev"
      type="button"
      {...restProps}
    >
      <svg
        width="9"
        height="16"
        viewBox="0 0 9 16"
        fill="none"
        className="embla__button__svg h-[20px] w-[10px]"
      >
        <path
          d="M7 2.19672L1 8.19672L7 14.1967"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="square"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </button>
  );
};

export const NextButton: React.FC<PropType> = (props) => {
  const {children, ...restProps} = props;

  return (
    <button
      className="embla__button embla__button--next"
      type="button"
      {...restProps}
    >
      <svg
        width="9"
        height="16"
        viewBox="0 0 9 16"
        fill="none"
        className="embla__button__svg h-[20px] w-[10px]"
      >
        <path
          d="M2 14.1967L8 8.19672L2 2.19672"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="square"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </button>
  );
};
