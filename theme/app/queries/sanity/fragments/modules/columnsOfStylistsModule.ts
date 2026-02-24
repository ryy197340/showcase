import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {IMAGE} from '../image';
import {LINKS} from '../links';
export const COLUMNS_OF_STYLISTS_MODULE = groq`
  _key,
  _type,
  columns[] {
    _key,
    _type,
    imageContent {
      image {
        ${IMAGE}
      },
      imageMobile {
        ${IMAGE}
      },
      altText,
      imageLoading,
    },
    textContent {
      colorTheme->{
        ${COLOR_THEME}
      },
      textFields[] {
        (_type == 'headingObject') => {
          name,
          _key,
          _type,
        },
        (_type == 'descriptionObject') => {
          description,
          _key,
          _type,
        },
        (_type == 'linkInternal') => {
          ${LINKS}
        },
      },
    },
  },
`;
