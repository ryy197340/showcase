import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';

export const JOT_FORM = groq`
  _type,
  iframeUrl,	
  colorTheme->{
    ${COLOR_THEME}
  }
`;
