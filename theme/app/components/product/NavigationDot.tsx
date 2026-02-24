import clsx from 'clsx';

type Props = {
  activeDotIndex: number;
  handleDotClick: (index: number) => void;
  index: number;
};

export default function NavigationDot({
  activeDotIndex,
  handleDotClick,
  index,
}: Props) {
  return (
    <button
      onClick={() => handleDotClick(index)}
      className={clsx('h-2 w-2 rounded-full', {
        'bg-darkGray': index === activeDotIndex,
        'bg-gray': index !== activeDotIndex,
      })}
    />
  );
}
