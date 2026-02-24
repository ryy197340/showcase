import groq from 'groq';

import {BLOG_POST} from './fragments/pages/blogPost';
export const BLOG_PAGE_ALL_CATEGORY_QUERY = groq`
  *[_type == 'blogPost' && category == $handle] | order(date desc) {
    ${BLOG_POST}
  }
`;
