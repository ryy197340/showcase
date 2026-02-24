import groq from 'groq';

import {
  COLLECTION_FALLBACK_MODULES,
  COLLECTION_PAGE,
  COLLECTION_PAGE_LOWER_MODULES_FRAGMENT,
  COLLECTION_PAGE_MODULES_FRAGMENT,
} from './fragments/pages/collection';

export const COLLECTION_PAGE_QUERY = groq`
  *[
    _type == 'collection'
    && store.slug.current == $slug
  ] | order(_updatedAt desc) [0]{
    ${COLLECTION_PAGE}
  }
`;

export const COLLECTION_PAGE_MODULES_QUERY = groq`
  *[
    _type == 'collection'
    && store.slug.current == $slug
  ] | order(_updatedAt desc) [0]{
    ${COLLECTION_PAGE_MODULES_FRAGMENT}
  }
`;

export const COLLECTION_PAGE_LOWER_MODULES_QUERY = groq`
  *[
    _type == 'collection'
    && store.slug.current == $slug
  ] | order(_updatedAt desc) [0]{
    ${COLLECTION_PAGE_LOWER_MODULES_FRAGMENT}
  }
`;

export const COLLECTION_FALLBACK_QUERY = groq`
  *[_id == 'emptyCollectionFallback'][0]{
    ${COLLECTION_FALLBACK_MODULES}
  }
`;
