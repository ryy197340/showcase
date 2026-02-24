import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {LINKS} from '../links';

export const COLUMNS_OF_TEXT_MODULE = groq`
  _key,
  _type,
  columns[] {
    _key,
    _type,
    textContent {
      colorTheme->{
        ${COLOR_THEME}
      },
      textFields[] {
        (_type == 'headingObject') => {
          heading,
          _key,
          _type,
        },
        (_type == 'subHeadingObject') => {
          subHeading,
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
