import groq from 'groq';

import {LINKS} from '../links';
import {PORTABLE_TEXT} from '../portableText/portableText';

export const MODULE_QUOTE_BANNER = groq`
  _type,
  _key,
  quoteLink {
    ${LINKS}
  },
  richText[0]{
    ${PORTABLE_TEXT}
  }
`;
