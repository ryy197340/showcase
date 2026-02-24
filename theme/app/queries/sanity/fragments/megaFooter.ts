import groq from 'groq';

import {LINKS} from './links';

export const MEGA_FOOTER = groq`
  _type,
  monogramText,
  footerNavigation[] {
    _type,
    _key,
    footerSectionTitle,
    footerSectionLinklist[] {
      ${LINKS}
    }
  },
`;
