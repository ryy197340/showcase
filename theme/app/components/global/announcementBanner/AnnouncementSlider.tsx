import {useContext, useEffect, useState} from 'react';

import {SingleAnnouncement} from '~/lib/sanity';
import {GlobalContext} from '~/lib/utils';

import Announcement from './Announcement';

type Props = {
  singleAnnouncements: SingleAnnouncement[];
  interval: number;
};

export default function AnnouncementSlider({
  singleAnnouncements,
  interval,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const {locale} = useContext(GlobalContext);

  useEffect(() => {
    if (locale.country !== 'US') return;
    const timerId = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % singleAnnouncements.length);
    }, interval * 1000);

    return () => clearInterval(timerId);
  }, [singleAnnouncements.length, interval, locale.country]);

  const ANNOUNCEMENT_CLASSNAMES =
    'flex w-full min-w-full items-center justify-center text-2xs font-semibold transition-all';

  return (
    <div
      className={`flex flex-nowrap items-center overflow-hidden${
        locale.country === 'US' ? ' py-[10.5px]' : ''
      } lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:transform`}
    >
      {locale.country === 'US' ? (
        singleAnnouncements?.map((announcement) => {
          return (
            <div
              key={announcement._key}
              className={ANNOUNCEMENT_CLASSNAMES}
              style={{transform: `translate(-${currentIndex * 100}%)`}}
            >
              <Announcement announcement={announcement} />
            </div>
          );
        })
      ) : (
        <div
          className={ANNOUNCEMENT_CLASSNAMES}
          id="global-e-free-shipping-banner-container"
        ></div>
      )}
    </div>
  );
}
