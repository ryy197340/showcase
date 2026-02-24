import groq from 'groq';

import {IMAGE} from '../image';
import {LINK_INTERNAL} from '../linkInternal';
import {LINKS} from '../links';

export const MODULE_IMAGE_GRID = groq`
  _type,
  _key,
  sidebar{
    sidebarEnable,
    sidebarHeading,
    sidebarDescription,
    sidebarLinkText {
      ${LINK_INTERNAL}
    }
  },
  images[]{
    _type,
    _key,
    'link': links {
      ${LINKS}
    },
    image {
      ${IMAGE}
    },
    imageMobile {
      ${IMAGE}
    },
    altText,
    hideCta,
  }
`;
