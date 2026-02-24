import groq from 'groq';

import {COLLECTION} from '../collection';
import {IMAGE} from '../image';
import {LINK_INTERNAL} from '../linkInternal';

export const MODULE_SHOP_BY_COLLECTION = groq`
  _type,
  _key,
  moduleHeading,
  moduleSubHeading,
  'collections': collections[] {
    _type,
    _key,
    panelHeading,
    panelButtonText,
    panelTextPlacement,
    panelImage {
      ${IMAGE}
    },
    panelImageMobile {
      ${IMAGE}
    },
    panelImageAltText,
    'panelCollectionReference': panelCollectionReference->{
      ${COLLECTION}
    },
    panelInternalLink {
      ${LINK_INTERNAL}
    }
  }
`;
