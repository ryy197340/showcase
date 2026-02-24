import groq from 'groq';

import {LINKS} from './links';

export const FOOTER_UTILITIES = groq`
  emailUsAddress,
  callUsNumber,
  "link": links[0] {
    ${LINKS}
  }
`;
