import {
  NextButton,
  PrevButton,
} from '~/components/modules/EmblaCarouselArrowButtons';

type Props = {
  onPrevButtonClick: () => void;
  prevBtnDisabled: boolean;
  onNextButtonClick: () => void;
  nextBtnDisabled: boolean;
};

export const BUTTON_CLASSNAMES =
  'z-[1] flex h-[25px] w-[15px] md:h-[40px] md:w-[30px] cursor-pointer items-center justify-center bg-[#F2F3F5] bg-opacity-50 disabled:opacity-[.3] pointer-events-auto';

export default function PrevNextButtons({
  onPrevButtonClick,
  prevBtnDisabled,
  onNextButtonClick,
  nextBtnDisabled,
}: Props) {
  return (
    <>
      <PrevButton
        className={BUTTON_CLASSNAMES}
        onClick={onPrevButtonClick}
        disabled={prevBtnDisabled}
      />
      <NextButton
        className={BUTTON_CLASSNAMES}
        onClick={onNextButtonClick}
        disabled={nextBtnDisabled}
      />
    </>
  );
}
