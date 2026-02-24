import groq from 'groq';

import {IMAGE} from '../image';
import {MODULES} from '../modules';
import {SEO} from '../seo';
export const BLOG_POST = groq`
  _type,
  _id,
  title,
  ${SEO},
  slug {
    current,
    _type
  },
  category,
  tags,
  includeInRecent,
  date,
  author,
  _createdAt,
  modules[]{
    ${MODULES}
  },
  featuredImage {
    ${IMAGE}
  },
  featuredImageMobile {
    ${IMAGE}
  },
  altText,
  shortDescription,
`;
