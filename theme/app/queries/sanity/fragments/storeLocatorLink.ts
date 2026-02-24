import groq from 'groq';

import {LINKS} from './links';

export const STORE_LOCATOR_LINK = groq`
  _type,
  _key,
  ${LINKS}
`;
