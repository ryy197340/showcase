import groq from 'groq';

import {IMAGE} from '../image';
import {LINKS} from '../links';

export const IMAGE_COLUMN = groq`
  'title': featuredImageLink.title,
  altText,
  'image': navImage {
    ${IMAGE}
  },
  hideTitle,
  disableHoverZoom,
  font,
  textAlign,
  textOverlay,
  largeText,
  'link': featuredImageLink {
    ${LINKS}
  },
`;
