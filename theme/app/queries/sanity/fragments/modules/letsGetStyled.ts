import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';

export const MODULE_LETS_GET_STYLED = groq`
  _type,
  iframeUrl,
  descriptionText,
  colorTheme->{
    ${COLOR_THEME}
  }
`;
