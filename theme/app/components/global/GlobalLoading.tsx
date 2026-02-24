import {useNavigation} from '@remix-run/react';
import clsx from 'clsx';
import {useEffect, useState} from 'react';

import LoadingIcon from '../icons/Loading';

export default function GlobalLoading() {
  const navigation = useNavigation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setActive(navigation.state !== 'idle');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigation.state]);

  return (
    <>
      {active && (
        <div
          role="progressbar"
          aria-valuetext={active ? 'Loading' : undefined}
          aria-hidden={!active}
          className={clsx(
            'fixed bottom-0 left-0 right-0 top-0 z-[200] flex items-center justify-center bg-black/10 transition-all duration-500 ease-out',
            active ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <LoadingIcon />
        </div>
      )}
    </>
  );
}
