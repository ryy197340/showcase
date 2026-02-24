import groq from 'groq';

import {COLOR_THEME} from './colorTheme';
import {IMAGE} from './image';
import {LINK_EXTERNAL} from './linkExternal';
import {LINK_INTERNAL} from './linkInternal';
import {PORTABLE_TEXT} from './portableText/portableText';

export const SLOTTED_CONTENT = groq`
    ...,
    hideMobile,
    hideTablet,
    hideDesktop,
    image {
      ${IMAGE}
    },
    imageMobile {
      ${IMAGE}
    },
    altText,
    richTextBody[]{
      ${PORTABLE_TEXT}
    },
    widthRadio,
    page,
    widthMobileRadio,
    "links" : links[0] {
      (_type == 'linkExternal') => {
        ${LINK_EXTERNAL}
      },
      (_type == 'linkInternal') => {
        ${LINK_INTERNAL}
      },
    },
    colorTheme->{
      ${COLOR_THEME}
    },
`;
