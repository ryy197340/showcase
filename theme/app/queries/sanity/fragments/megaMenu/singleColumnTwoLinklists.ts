import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {LINKS} from '../links';

export const SINGLE_COLUMN_TWO_LINKLISTS = groq`
  _type,
  _key,
  columnWidth,
  buttonStyle->{
      ${COLOR_THEME}
    },
  hideMobileLink,
  linkLists[] {
    _key,
    _type,
    hideMobileLink,
    'title': columnTitle,
    linkList[] {
      ${LINKS}
    },
  },
`;
