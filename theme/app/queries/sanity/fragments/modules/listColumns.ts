import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
export const LIST_COLUMNS = groq`
     _type,
    _key,
    heading,
    'columns': columns[]{
      _key,
      columnHeading,
      'columnStrings': columnStrings[],
    },
    bottomContent,
    colorTheme->{
      ${COLOR_THEME}
    }
`;
