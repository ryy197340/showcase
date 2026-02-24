import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {IMAGE} from '../image';
import {PRODUCT_HOTSPOT} from '../productHotspot';
import {PRODUCT_WITH_VARIANT} from '../productWithVariant';

export const MODULE_CATALOG = groq`
  _key,
  _type,
  catalogItems[] {
    _key,
    "selection": selection,
    "image": {
      ...,
      ${IMAGE}
    },
    "style": style,
    "altText": altText,
    "variant": variant,
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
    "imageText": imageText,
    "singleFieldSubtext": singleFieldSubtext,
    "textAlignment": textAlignment,
    "shopNowText": shopNowText,
    "linkTextAlignment": linkTextAlignment,
    colorTheme->{
      ${COLOR_THEME}
    },
    imageGrid {
      images[] {
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
        colorTheme->{
          ${COLOR_THEME}
        },
        ...,
        ${IMAGE}
      },
    }
  }
`;
