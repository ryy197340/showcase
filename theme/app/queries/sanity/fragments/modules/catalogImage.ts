import groq from 'groq';

import {TEXT} from '../../fragments/heroes/text';
import {COLOR_THEME} from '../colorTheme';
import {IMAGE} from '../image';
import {PRODUCT_WITH_VARIANT} from '../productWithVariant';
import {STYLE_SETTINGS} from './styleSettings';

export const MODULE_CATALOG_IMAGE = groq`
  _key,
  _type,
  selection,
  "image": image {
      ...,
      ${IMAGE}
  },
  "imageMobile": imageMobile {
      ...,
      ${IMAGE}
  },
  altText,
  imageFit,
  style,
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
  imageText,
  textModule {
    ${TEXT}
  },
  singleFieldSubtext,
  textAlignment,
  shopNowText,
  linkTextAlignment,
  colorTheme->{
      ${COLOR_THEME}
  },
  ${STYLE_SETTINGS}
`;
