import {KeyboardEvent, useEffect, useState} from 'react';

import ScrollToTopIcon from '../icons/ScrollToTop';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      scrollToTop();
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-[130px] right-[10px] z-50 flex justify-center transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'hidden'
      }`}
    >
      <div
        className="cursor-pointer"
        onClick={scrollToTop}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <ScrollToTopIcon />
      </div>
    </div>
  );
}
