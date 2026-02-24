import groq from 'groq';

import {LINK_INTERNAL} from '../linkInternal';

export const FEATURED_PRODUCTS_GRID = groq`
  product[]{
    ...,
    _key,
  },
  hideSwatches,
  hideReviews,
  sidebar{
    sidebarSubtitle,
    sidebarMenuItemsArray[]{
     ${LINK_INTERNAL}
    }
  },
  title
`;
