import {useEffect, useRef} from 'react';

import MinusIcon from '../icons/Minus';
import PlusIcon from '../icons/Plus';

interface CollapsibleProps {
  title: string;
  description?: object | string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Collapsible({
  title,
  description,
  isOpen,
  onToggle,
}: CollapsibleProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Function to calculate the content height when the collapsible is shown
    const calculateContentHeight = () => {
      if (contentRef.current) {
        contentRef.current.style.height = isOpen ? 'auto' : '0px';
      }
    };
    calculateContentHeight();
  }, [isOpen]);

  return (
    <div className="border-t py-2">
      <button
        onClick={onToggle}
        className="bg-gray-600 flex w-full items-center justify-between py-2 text-left text-[12px] font-bold uppercase text-primary"
      >
        {title}
        {isOpen ? <MinusIcon /> : <PlusIcon />}
      </button>
      <div
        ref={contentRef}
        className={`max-h-0 overflow-hidden transition-all duration-300 ${
          isOpen ? 'tablet-overflow max-h-screen' : ''
        }`}
      >
        <div className="py-4">
          {typeof description === 'string' ? (
            <div
              className="text-[12px]"
              dangerouslySetInnerHTML={{__html: description}}
            ></div>
          ) : (
            <>{description}</>
          )}
        </div>
      </div>
    </div>
  );
}
