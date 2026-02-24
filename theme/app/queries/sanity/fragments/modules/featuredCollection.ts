import groq from 'groq';

import {COLLECTION} from '../collection';

export const MODULE_FEATURED_COLLECTION = groq`
  _type,
  _key,
  linkText,
  moduleDescription,
  moduleHeading,
  collection->{
    ${COLLECTION}
  }
`;
