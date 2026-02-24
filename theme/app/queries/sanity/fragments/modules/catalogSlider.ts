import groq from 'groq';

import {IMAGE} from '../image';
import {PRODUCT_WITH_VARIANT} from '../productWithVariant';
export const MODULE_CATALOG_SLIDER = groq`
  _key,
  _type,
  images[] {
    _key,
    image {
      "image": {
        ...,
        ${IMAGE}
      },
    },
    imageMobile {
      "imageMobile": {
        ...,
        ${IMAGE}
      },
    },
    hotspots[] {
      ...,
      _key,
      "product": productWithVariant {
        ...${PRODUCT_WITH_VARIANT}
      },
      x,
      y,
      "relatedProducts": relatedProducts[]{
        ...${PRODUCT_WITH_VARIANT}
      }
    },
    altText,
    variant,
  }
`;
