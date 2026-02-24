import groq from 'groq';

import {BLOG_POST} from './fragments/pages/blogPost';

export const BLOG_PAGE_QUERY = groq`
  *[_type == 'blogPost'] | order(date desc){
    ${BLOG_POST}
  }
`;

// Lightweight query for sidebar - only fetches 5 most recent posts with minimal fields
export const BLOG_SIDEBAR_QUERY = groq`
  *[_type == 'blogPost'] | order(date desc){
    _id,
    _type,
    title,
    date,
    includeInRecent,
    category,
    slug {
      current
    }
  }
`;
