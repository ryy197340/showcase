import groq from 'groq';

import {BLOG_POST} from './fragments/pages/blogPost';
export const BLOG_PAGE_CATEGORY_QUERY = groq`
  *[_type == 'blogPost' && category == $handle] | order(date desc) [$start...$end]{
    ${BLOG_POST}
  }
`;
