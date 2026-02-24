import groq from 'groq';

import {BLOG_POST} from '../pages/blogPost';
//import {BLOG_SINGLE} from '../../blogSingle';

export const HP_FEATURED_BLOG_POSTS = groq`
  *[_type == 'blogPost'] | order(date desc) [0...5] {
    ${BLOG_POST}
  }
`;
