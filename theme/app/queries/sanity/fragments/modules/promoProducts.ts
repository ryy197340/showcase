import groq from 'groq';

import {COLLECTION} from '../collection';

export const PROMO_PRODUCTS = groq`
  _type,
  _key,
  collection->{
    ${COLLECTION}
  }
`;
