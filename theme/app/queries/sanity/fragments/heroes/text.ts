import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {LINK_INTERNAL} from '../linkInternal';
import {LINKS} from '../links';

export const TEXT = groq`
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
        heading,
        headerLevel,
        _key,
        colorTheme->{${COLOR_THEME}}
      },
      (_type == 'subHeadingObject') => {
        subHeading,
        _key,
        colorTheme->{${COLOR_THEME}},
      },
      (_type == 'descriptionObject') => {
        description,
        _key,
        colorTheme->{${COLOR_THEME}},
      },
      (_type == 'linkInternal') => {
        ${LINK_INTERNAL}
      },
    },
  },
`;
