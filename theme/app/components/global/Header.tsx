import clsx from 'clsx';
import {useEffect, useState} from 'react';

import HeaderBackground from '~/components/global/HeaderBackground';
import {useHydration} from '~/hooks/useHydration';

type Props = {
  transparentHeader: boolean;
};

export default function Header({transparentHeader}: Props) {
  const isHydrated = useHydration();
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState(() =>
    isHydrated ? window.scrollY : 0,
  );

  const stickyHeader = visible ? 'visible' : 'hidden';

  useEffect(() => {
    const handleScroll = () => {
      const moving = window.scrollY;

      setVisible(position > moving);
      setPosition(moving);
    };
    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => {
      // @ts-expect-error https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener#matching_event_listeners_for_removal
      window.removeEventListener('scroll', handleScroll, {passive: true});
    };
  });

  return (
    <header
      className={clsx(
        transparentHeader ? 'sticky lg:fixed' : 'sticky',
        position === 0 && transparentHeader ? 'lg:bg-transparent' : 'bg-white',
        'align-center left-0 top-0 z-40 flex w-full transition-all duration-[275ms] ease-out',
        stickyHeader === 'visible' ? 'lg:top-0' : 'lg:top-[-162px]',
      )}
    >
      <HeaderBackground
        stickyHeader={stickyHeader}
        position={position}
        transparentHeader={transparentHeader}
      />
    </header>
  );
}
