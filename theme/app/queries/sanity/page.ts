import groq from 'groq';

import {PAGE} from './fragments/pages/page';

export const PAGE_QUERY = groq`
  *[
    _type == 'page'
    && slug.current == $handle
  ] | order(_updatedAt desc) [0]{
    ${PAGE}
  }
`;
