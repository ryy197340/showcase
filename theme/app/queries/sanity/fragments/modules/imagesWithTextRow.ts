import groq from 'groq';

import {IMAGE_WITH_TEXT} from '../heroes/imageWithText';

export const IMAGES_WITH_TEXT_ROW = groq`
    _type,
    images[] {
        ...${IMAGE_WITH_TEXT}
    },
    imageLoading
`;
