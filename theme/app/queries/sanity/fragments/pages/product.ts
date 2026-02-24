import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {CUSTOM_PRODUCT_OPTIONS} from '../customProductOptions';
import {IMAGE} from '../image';
import {LINKS} from '../links';
import {MODULES} from '../modules';
import {PORTABLE_TEXT} from '../portableText/portableText';
import {SEO_SHOPIFY} from '../seoShopify';

export const PRODUCT_PAGE = groq`
  _id,
  "available": !store.isDeleted && store.status == 'active',
  body[]{
    ${PORTABLE_TEXT}
  },
  colorTheme->{
    ${COLOR_THEME}
  },
  "customProductOptions": *[_type == 'settings'][0].customProductOptions[title in ^.store.options[].name] {
    ${CUSTOM_PRODUCT_OPTIONS}
  },
  "pdpMessageFromJMCL": *[_type == 'settings'][0].pdpMessageFromJMCL {
    show,
    heading,
    image {
      ${IMAGE}
    },
    MFJMCL_richText[]{
      ${PORTABLE_TEXT}
    },
  },
  "pdpRequestACatalog": *[_type == 'settings'][0].pdpRequestACatalog {
    show,
    RAC_richText[]{
      ${PORTABLE_TEXT}
    },
    heading,
    virtualCatalogLink[0] {
      ${LINKS}
    },
    requestACatalog[0] {
      ${LINKS}
    },
    image {
      ${IMAGE}
    },
  },
  "pdpFinalSale": *[_type == 'settings'][0].pdpFinalSale {
    bodyText,
    heading
  },
  "gid": store.gid,
  ${SEO_SHOPIFY},
  "slug": store.slug.current,
  modules[]{
    ${MODULES}
  },
  bazaarVoiceUGC,
  bazaarVoiceUGCPlacement
`;
