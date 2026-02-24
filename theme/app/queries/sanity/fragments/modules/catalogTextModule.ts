import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {LINKS} from '../links';
import {PORTABLE_TEXT} from '../portableText/portableText';

export const CATALOG_TEXT = groq`
  _key,
  textContent {
    colorTheme->{
      ${COLOR_THEME}
    },
    styles[],
    textFields[] {
      _key,
      _type,
      (_type == 'headingObject') => {
        heading[]{
        ${PORTABLE_TEXT}
        },
        _key,
        colorTheme->{${COLOR_THEME}}
      },
      (_type == 'subHeadingObject') => {
        subHeading[]{${PORTABLE_TEXT}},
        _key,
        colorTheme->{${COLOR_THEME}},
      },
      (_type == 'descriptionObject') => {
        description[]{
        ${PORTABLE_TEXT}
        },
        _key,
        colorTheme->{${COLOR_THEME}},
      },
      (_type == 'linkInternal') => {
        ${LINKS}
      },
    },
  },
`;
