import groq from 'groq';

import {IMAGE} from '../image';
import {LINKS} from '../links';

export const MODULE_FEATURED_PRODUCTS = groq`
  _type,
  _key,
  heading,
  subheading,
  productColumns[] {
    (_type == "singleProductColumn") => {
      _type,
      _key,
      heading,
      image {
        ${IMAGE}
      },
      imageMobile {
        ${IMAGE}
      },
      altText,
      link {
        ${LINKS}
      },
    },
    (_type == "twoProductColumn") => {
      _type,
      _key,
      twoProductColumns[] {
        _type,
        _key,
        heading,
        link {
          ${LINKS}
        },
        image {
          ${IMAGE}
        },
        imageMobile {
          ${IMAGE}
        },
        altText,
      },
    },
  },
`;
