import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {LINK_EXTERNAL} from '../linkExternal';
import {LINK_INTERNAL} from '../linkInternal';

export const MODULE_CALLOUT_BUTTON = groq`
	"link": links[0] {
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
  cssClass
`;
