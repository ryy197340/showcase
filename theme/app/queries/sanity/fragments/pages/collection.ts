import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {HERO_COLLECTION} from '../heroes/collection';
import {MODULES} from '../modules';
import {CATALOG_IMAGE_NEW} from '../modules/catalogImageNew';
import {MODULE_CATALOG_ROW_OF_IMAGES} from '../modules/catalogRowOfImages';
import {VIDEOWISE_HTML} from '../modules/videowiseHTML';
import {SEO_SHOPIFY} from '../seoShopify';
import {SLOTTED_CONTENT} from '../slottedContent';

export const COLLECTION_PAGE = groq`
  _id,
  colorTheme->{
    ${COLOR_THEME}
  },
  (showHero == true) => {
    hero {
      ${HERO_COLLECTION}
    },
  },
  "altGridObject": {
  "altGrid": altGrid,
  "altGridProducts": altGridProducts,
  "every2rows": every2rows,
  alternatingHeroLayout {
    enabled,
    content[] {
      ${CATALOG_IMAGE_NEW}
    },
  },
},
  hideFilterBreadcrumbs,
  ${SEO_SHOPIFY},
  "slug": store.slug.current,
  "sortOrder": store.sortOrder,
  "title": store.title,
  customPageTitle,
  "slottedContent": slottedContent.Content[] {
    (_type == 'content') => {
      ${SLOTTED_CONTENT}
    },
    (_type == 'catalogRowOfImages') => {
      ${MODULE_CATALOG_ROW_OF_IMAGES}
    },
    (_type == 'videowiseHTML') => {
      ${VIDEOWISE_HTML}
    },
}
`;

// collection query split into two parts due to request size limitations
export const COLLECTION_PAGE_MODULES_FRAGMENT = groq`
  modules[] { ${MODULES} }
`;

export const COLLECTION_PAGE_LOWER_MODULES_FRAGMENT = groq`
  lowerModules[] { ${MODULES} }
`;

export const COLLECTION_FALLBACK_MODULES = groq`
modules[] {
  ${MODULES}
}
`;
