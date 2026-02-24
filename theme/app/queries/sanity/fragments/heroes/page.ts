import groq from 'groq';

import {HERO_CAROUSEL} from '../heroCarousel';
import {IMAGE_WITH_PRODUCT_HOTSPOTS} from '../imageWithProductHotspots';
import {MODULE_BACK_TO_LINK} from '../modules/backToLink';
import {MODULE_TABLE_DATA} from '../modules/table';
import {PRODUCT_WITH_VARIANT} from '../productWithVariant';
import {IMAGE_WITH_TEXT} from './imageWithText';
import {SINGLE_TESTIMONIAL} from './singleTestimonial';
import {TEXT} from './text';

export const HERO_PAGE = groq`
  content[0] {
    _type,
    (_type == 'heroCarousel') => {
      ${HERO_CAROUSEL}
    },
    (_type == 'module.backToLink') => {
      ${MODULE_BACK_TO_LINK}
    },
    (_type == 'imageWithProductHotspots') => {
      ${IMAGE_WITH_PRODUCT_HOTSPOTS}
    },
    (_type == 'productWithVariant') => {
      ...${PRODUCT_WITH_VARIANT}
    },
    (_type == 'module.imageWithText') => {
      ...${IMAGE_WITH_TEXT}
    },
    (_type == 'module.singleTestimonial') => {
      ...${SINGLE_TESTIMONIAL}
    },
    (_type == 'module.tableData') => {
      ${MODULE_TABLE_DATA}
    },
    (_type == 'module.textModule') => {
      ...${TEXT}
    },
  },
  title
`;
