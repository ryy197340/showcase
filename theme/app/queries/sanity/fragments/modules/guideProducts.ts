import groq from 'groq';

import {IMAGE} from '../image';
import {LINKS} from '../links';

export const GUIDE_PRODUCT = groq`
  _type == 'module.guideProduct' => {
    _key,
    images[] {
      'guideProductImage': {
        image {
          ${IMAGE}
        },
        imageMobile {
          ${IMAGE}
        },
        imageAltText,
      },
    },
    'productInfo': productInfo {
      productTitle,
      productDescription,
      bulletPoints[],
      internalLink {
        ${LINKS}
      },
    },
  }
`;
