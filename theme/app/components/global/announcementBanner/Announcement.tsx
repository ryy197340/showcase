import {Link} from '@remix-run/react';

import {SingleAnnouncement} from '~/lib/sanity';

import LocalizedA from '../LocalizedA';

type Props = {
  announcement: SingleAnnouncement;
};

export default function Announcement({announcement}: Props) {
  if (announcement.announcementLink) {
    const currentLink = announcement.announcementLink[0];
    if (currentLink._type == 'linkInternal' && currentLink.slug) {
      return (
        <Link
          className="text-2xs"
          key={currentLink._key}
          to={currentLink.slug}
          prefetch="intent"
        >
          {announcement.announcementText}
        </Link>
      );
    }
    if (currentLink._type === 'linkExternal') {
      return (
        <LocalizedA
          className="text-2xs"
          key={currentLink._key}
          href={currentLink.url}
          rel="noreferrer"
          target={currentLink.newWindow ? '_blank' : '_self'}
        >
          {announcement.announcementText}
        </LocalizedA>
      );
    }
  } else {
    return announcement.announcementText;
  }
}
