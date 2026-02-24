import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {COMPLETE_THE_LOOK} from './completeTheLookModule';

export const COMPLETE_THE_LOOK_ROW = groq`
    _type,
    _key,
    groupTitle,
    colorTheme->{
        ${COLOR_THEME}
    },
    content[]{
        ${COMPLETE_THE_LOOK}
    },
`;
