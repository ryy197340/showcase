import clsx from 'clsx';

import {Color, SingleAnnouncement} from '~/lib/sanity/types';

import {CountrySelector} from '../localizationSelector/CountrySelector';
import AnnouncementSlider from './AnnouncementSlider';

type Props = {
  announcementSettings?: {
    singleAnnouncements?: SingleAnnouncement[];
    backgroundColor?: Color;
    interval?: number;
  };
};

export default function AnnouncementBanner({announcementSettings}: Props) {
  const {singleAnnouncements, backgroundColor, interval} =
    announcementSettings || {};
  return (
    <div
      className={clsx(
        backgroundColor?.hex && 'bg-primary',
        'text-center text-xs uppercase text-white md:px-10 lg:justify-start',
      )}
      style={backgroundColor?.hex ? {backgroundColor: backgroundColor.hex} : {}}
    >
      <div className="page-width relative w-full">
        {/* Country Selector */}
        <div className="hidden h-[35px] lg:flex">
          {/* Commented out until Global-E JME-351 */}
          <CountrySelector />
        </div>

        {/* Announcement Slider */}
        {singleAnnouncements && (
          <AnnouncementSlider
            singleAnnouncements={singleAnnouncements}
            interval={interval ? interval : 4}
          />
        )}
      </div>
    </div>
  );
}
