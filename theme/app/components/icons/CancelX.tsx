import {SVGAttributes} from 'react';

type Props = {
  closeDiv: () => void;
};

export default function CancelIcon({
  closeDiv,
  ...props
}: Props & SVGAttributes<SVGElement>) {
  const handleClick = () => {
    closeDiv();
    // Focus on the first input field with the class name 'search-input'
    const screenWidth = window.innerWidth;
    if (screenWidth >= 768) {
      // Focus on the desktop search input when screen width is 768px or more
      const input = document.querySelector('.search-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    } else {
      // Focus on the mobile search input when screen width is less than 768px
      const input = document.querySelector(
        '#search-bar .search-input',
      ) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }
  };

  return (
    <button
      type="button"
      aria-label="clear search input text"
      className={`search-clear-btn absolute right-0 top-1/2 h-[16px] w-[16px] -translate-y-1/2 transform rounded-full border-4 border-cancelGray bg-cancelGray`}
      onClick={handleClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="">
        <path
          d="m1 1 22 22M23 1 1 23"
          stroke="white"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        ></path>
      </svg>
    </button>
  );
}
