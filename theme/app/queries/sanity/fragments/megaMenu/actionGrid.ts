import groq from 'groq';

import {IMAGE} from '../image';
import {LINKS} from '../links';

export const ACTION_GRID = groq`
  _key,
  _type,
  columnWidth,
  imageColumn[] {
    _key,
    altText,
    actionGridColumnImage {
      ${IMAGE}
    },
    actionGridColumnImageLink {
      ${LINKS}
    },
  },
  actionGridFeaturedImage {
    ${IMAGE}
  },
  altText,
  actionGridFeaturedImageLink {
    ${LINKS}
  }
`;
