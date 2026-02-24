import groq from 'groq';

import {IMAGE} from '../image';
import {IMAGE_WITH_PRODUCT_HOTSPOTS} from '../imageWithProductHotspots';
import {POD_SLIDER} from '../modules/podSlider';
import {PRODUCT_WITH_VARIANT} from '../productWithVariant';

export const HERO_COLLECTION = groq`
  content[0] {
    _type,
    (_type == 'imageWithProductHotspots') => {
      ${IMAGE_WITH_PRODUCT_HOTSPOTS}
    },
    (_type == 'productWithVariant') => {
      ...${PRODUCT_WITH_VARIANT}
    },
    (_type == 'module.podSlider') => {
      ...${POD_SLIDER}
    },
  },
  description,
  title,
  image {
    ${IMAGE}
  },
  imageMobile {
    ${IMAGE}
  },
  altText,
`;
