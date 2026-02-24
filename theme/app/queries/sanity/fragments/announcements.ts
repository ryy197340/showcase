import groq from 'groq';

import {LINKS} from './links';

export const ANNOUNCEMENTS = groq`
  "singleAnnouncements": announcements[]{
    _type,
    _key,
    announcementText,
    announcementLink[] {
      ${LINKS}
    }
  },
  "backgroundColor": {
    "hex": backgroundColor.hex,
    "_type": 'color',
    "alpha": backgroundColor.alpha,
    "rgb": backgroundColor.rgb,
  },
  interval,
  _type
`;
