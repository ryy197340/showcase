import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {IMAGE} from '../image';

export const COMPLETE_THE_LOOK = groq`
    _type,
    _key,
    title,
    variant,
    image {
        ${IMAGE}
    },
    altText,
    product[]{
        ...,
        _key,
    },
    colorTheme->{
        ${COLOR_THEME}
    },
`;
