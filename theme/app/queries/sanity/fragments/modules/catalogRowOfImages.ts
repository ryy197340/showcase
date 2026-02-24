import groq from 'groq';

import {TEXT} from '../../fragments/heroes/text';
import {COLOR_THEME} from '../colorTheme';
import {IMAGE} from '../image';
import {PRODUCT_WITH_VARIANT} from '../productWithVariant';

export const MODULE_CATALOG_ROW_OF_IMAGES = groq`
  _key,
  _type,
  index,
  page,
  hideMobile,
  hideTablet,
  hideDesktop,
  widthRadio,
  widthMobileRadio,
  colorTheme->{
    ${COLOR_THEME}
  },
  textModule {
    ${TEXT}
  },
  transparentBackground,
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
    ...,
    image {
        ${IMAGE}
    },
    imageMobile {
        ${IMAGE}
    },
    altText,
    textModule {
      ${TEXT}
    },
    colorTheme->{
      ${COLOR_THEME}
    },
    transparentBackground,
  },
`;
