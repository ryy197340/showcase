import groq from 'groq';

import {COLLECTION} from '../collection';

export const FEATURED_PRODUCTS_GRID_HOMEPAGE = groq`
  _type,
  _key,
  linkText,
  moduleDescription,
  moduleHeading,
  hideReviews,
  hideSwatches,
  collections[] {
    sidebarTitle,
    collection->{
      ${COLLECTION}
    }
  }
`;
