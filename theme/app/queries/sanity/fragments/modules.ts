import groq from 'groq';

import {HERO_CAROUSEL} from './heroCarousel';
import {IMAGE_WITH_TEXT} from './heroes/imageWithText';
import {SINGLE_TESTIMONIAL} from './heroes/singleTestimonial';
import {TEXT} from './heroes/text';
import {MODULE_ACCORDION} from './modules/accordion';
import {MODULE_BACK_TO_LINK} from './modules/backToLink';
import {MODULE_CALLOUT} from './modules/callout';
import {MODULE_CALLOUT_BUTTON} from './modules/calloutButton';
import {MODULE_CALL_TO_ACTION} from './modules/callToAction';
import {MODULE_CATALOG_IMAGE} from './modules/catalogImage';
import {CATALOG_IMAGE_NEW} from './modules/catalogImageNew';
import {MODULE_CATALOG_ROW_OF_IMAGES} from './modules/catalogRowOfImages';
import {MODULE_CATALOG_SLIDER} from './modules/catalogSlider';
import {MODULE_COLLECTION} from './modules/collection';
import {COLUMNS_OF_PRODUCTS} from './modules/columnsOfProducts';
import {COLUMNS_OF_STYLISTS_MODULE} from './modules/columnsOfStylistsModule';
import {COLUMNS_OF_TEXT_MODULE} from './modules/columnsOfTextModule';
import {COMPLETE_THE_LOOK} from './modules/completeTheLookModule';
import {COMPLETE_THE_LOOK_ROW} from './modules/completeTheLookRow';
import {MODULE_FEATURED_COLLECTION} from './modules/featuredCollection';
import {FEATURED_FABRIC} from './modules/featuredFabric';
import {MODULE_FEATURED_PRODUCTS} from './modules/featuredProducts';
import {FEATURED_PRODUCTS_GRID} from './modules/featuredProductsGrid';
import {FEATURED_PRODUCTS_GRID_HOMEPAGE} from './modules/featuredProductsGridHomepage';
import {FOUR_IMAGES_MODULE} from './modules/fourImagesModule';
import {GUIDE_PRODUCT} from './modules/guideProducts';
import {HERO_FULL_WIDTH} from './modules/heroFullWidth';
import {MODULE_IMAGE} from './modules/image';
import {MODULE_IMAGE_GRID} from './modules/imageGrid';
import {IMAGES_WITH_TEXT_ROW} from './modules/imagesWithTextRow';
import {MODULE_INSTAGRAM} from './modules/instagram';
import {JOT_FORM} from './modules/jotForm';
import {MODULE_LETS_GET_STYLED} from './modules/letsGetStyled';
import {LIST_COLUMNS} from './modules/listColumns';
import {ONE_TRUST_GDPR_DO_NOT_SELL} from './modules/oneTrustGDPRDoNotSell';
import {POD_SLIDER} from './modules/podSlider';
import {MODULE_PRODUCT} from './modules/product';
import {PROMO_PRODUCTS} from './modules/promoProducts';
import {PURE_HTML} from './modules/pureHTML';
import {MODULE_QUOTE_BANNER} from './modules/quoteBlock';
import {SHELF_HEADERS} from './modules/shelfHeaders';
import {MODULE_SHOP_BY_COLLECTION} from './modules/shopByCollection';
import {MODULE_TABLE_DATA} from './modules/table';
import {THREE_IMAGES_MODULE} from './modules/threeImagesModule';
import {VIDEOWISE_HTML} from './modules/videowiseHTML';
import {PORTABLE_TEXT} from './portableText/portableText';
export const MODULES = groq`
  _key,
  _type,
  (_type == "module.richText") => {
    richTextBody[]{
      ${PORTABLE_TEXT}
    },
    columnWidth,
  },
  (_type == "module.accordion") => {
    ${MODULE_ACCORDION}
  },
  (_type == 'module.heroFullWidth') => {
    ${HERO_FULL_WIDTH}
  },
  (_type == "module.backToLink") => {
    ${MODULE_BACK_TO_LINK}
  },
  (_type == "module.callout") => {
    ${MODULE_CALLOUT}
  },
  (_type == "module.calloutButton") => {
    ${MODULE_CALLOUT_BUTTON}
  },
  (_type == 'module.callToAction') => {
    ${MODULE_CALL_TO_ACTION}
  },
  (_type == 'heroCarousel' || _type == 'carousel') => {
    ${HERO_CAROUSEL}
  },
  (_type == "module.catalogImage") => {
    ${MODULE_CATALOG_IMAGE}
  },
  (_type == "module.catalogRowOfImages") => {
    ${MODULE_CATALOG_ROW_OF_IMAGES}
  },
  (_type == "module.catalogSlider") => {
    ${MODULE_CATALOG_SLIDER}
  },
  (_type == "module.collection") => {
    ${MODULE_COLLECTION}
  },
  (_type == 'module.columnsOfProducts') => {
    ${COLUMNS_OF_PRODUCTS}
  },
  (_type == "module.image") => {
    ${MODULE_IMAGE}
  },
  (_type == "module.instagram") => {
    ${MODULE_INSTAGRAM}
  },
  (_type == "module.product") => {
    ${MODULE_PRODUCT}
  },
  (_type == "module.guideProduct") => {
    ${GUIDE_PRODUCT}
  },
  (_type == "module.quoteBanner") => {
    ${MODULE_QUOTE_BANNER}
  },
  (_type == "module.shopByCollection") => {
    ${MODULE_SHOP_BY_COLLECTION}
  },
  (_type == "module.featuredCollection") => {
    ${MODULE_FEATURED_COLLECTION}
  },
  (_type == "module.featuredFabric") => {
    ${FEATURED_FABRIC}
  },
  (_type == "module.featuredProducts") => {
    ${MODULE_FEATURED_PRODUCTS}
  },
  (_type == "module.featuredProductsGrid") => {
    ${FEATURED_PRODUCTS_GRID}
  },
  (_type == "module.featuredProductsGridHomepage") => {
    ${FEATURED_PRODUCTS_GRID_HOMEPAGE}
  },
  (_type == "module.featuredFabric") => {
    ${GUIDE_PRODUCT}
  },
  (_type == "module.imageWithText") => {
    ${IMAGE_WITH_TEXT}
  },
  (_type == "module.pureHTML") => {
    ${PURE_HTML}
  },
  (_type == 'module.tableData') => {
    ${MODULE_TABLE_DATA}
  },
  (_type == "module.threeImagesModule") => {
    ${THREE_IMAGES_MODULE}
  },
  (_type == "module.imagesWithTextRow") => {
    ${IMAGES_WITH_TEXT_ROW}
  },
  (_type == "module.fourImagesModule") => {
    ${FOUR_IMAGES_MODULE}
  },
  (_type == "module.textModule") => {
    ${TEXT}
  },
  (_type == "module.columnsOfTextModule") => {
    ${COLUMNS_OF_TEXT_MODULE}
  },
  (_type == 'module.oneTrustGDPRDoNotSell') => {
    ${ONE_TRUST_GDPR_DO_NOT_SELL}
  },
  (_type == "module.promoProducts") => {
    ${PROMO_PRODUCTS}
  },
  (_type == "module.singleTestimonial") => {
    ${SINGLE_TESTIMONIAL}
  },
  (_type == "module.listColumns") => {
    ${LIST_COLUMNS}
  },
  (_type == "module.columnsOfStylistsModule") => {
    ${COLUMNS_OF_STYLISTS_MODULE}
  },
  (_type == 'module.jotForm') => {
    ${JOT_FORM}
  },
  (_type == "module.letsGetStyled") => {
    ${MODULE_LETS_GET_STYLED}
  },
  (_type == "module.imageGrid") => {
    ${MODULE_IMAGE_GRID}
  },
  (_type == "module.podSlider") => {
    ${POD_SLIDER}
  },
  (_type == "module.videowiseHTML") => {
    ${VIDEOWISE_HTML}
  },
  (_type == "module.catalogImageNew") => {
    ${CATALOG_IMAGE_NEW}
   },
  (_type == "module.completeTheLook") => {
    ${COMPLETE_THE_LOOK}
  },
  (_type == "module.completeTheLookRow") => {
    ${COMPLETE_THE_LOOK_ROW}
  },
  (_type == "module.shelfHeaders") => {
    ${SHELF_HEADERS}
  }
`;
