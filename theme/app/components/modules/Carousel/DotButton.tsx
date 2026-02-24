import {memo} from 'react';

import DotIcon from '~/components/icons/Dot';

type Props = {
  index: number;
  selected: boolean;
  onDotButtonClick: (index: number) => void;
  handleKeyDown: (
    event: React.KeyboardEvent<HTMLDivElement>,
    index: number,
  ) => void;
};

const DotButton = ({
  index,
  selected,
  onDotButtonClick,
  handleKeyDown,
}: Props) => {
  return (
    <div
      className={`embla__dot${selected ? ' embla__dot--selected' : ''}`}
      onClick={() => onDotButtonClick(index)}
      onKeyDown={(event) => handleKeyDown(event, index)}
      role="button"
      tabIndex={index}
    >
      <DotIcon />
    </div>
  );
};

export default memo(DotButton);
