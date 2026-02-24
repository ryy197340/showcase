import {NextButton, PrevButton} from '../modules/EmblaCarouselArrowButtons';
import {BUTTON_CLASSNAMES} from './buttons/PrevNextButtons';

type Props = {
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
};

export default function NavigationArrows({
  onNextButtonClick,
  onPrevButtonClick,
  prevBtnDisabled,
  nextBtnDisabled,
}: Props) {
  return (
    <div className="absolute top-[50%] flex w-full -translate-y-1/2 items-center justify-between gap-[10px]">
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
    </div>
  );
}
