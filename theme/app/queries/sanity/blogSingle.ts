import groq from 'groq';

import {BLOG_POST} from './fragments/pages/blogPost';
export const BLOG_PAGE_POST_QUERY = groq`
  *[_type == 'blogPost' && slug.current == $handle]{
    ${BLOG_POST}
  }
`;
