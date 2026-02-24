import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {LINKS} from '../links';

export const LINK_LIST_COLUMN = groq`
  'title': columnTitle,
  linkList[] {
    ${LINKS}
  },
  columnWidth,
  _key,
  hideMobileLink,
  buttonStyle->{
        ${COLOR_THEME}
      },
`;
