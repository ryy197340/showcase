import groq from 'groq';

import {IMAGE} from '../image';
import {LINK_INTERNAL} from '../linkInternal';

export const COLUMNS_OF_PRODUCTS = groq`
  _key,
  _type,
  columns[] {
    _key,
    _type,
    textContent {
      productImage {
        ${IMAGE}
      },
      productImageMobile {
        ${IMAGE}
      },
      "altText": altText,
      mobileSlideWidth,
      hoverZoom,
      borderRadius,
      textOverlay,
      textOverlayAlignment,
      textAlign,
      link {
        ${LINK_INTERNAL}
      },
    },
  },
`;
