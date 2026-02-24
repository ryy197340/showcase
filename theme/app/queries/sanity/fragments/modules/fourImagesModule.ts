import groq from 'groq';

import {IMAGE} from '../image';
import {LINKS} from '../links';

export const FOUR_IMAGES_MODULE = groq`
    _type,
    images[] {
        _type,
        _key,
        'link': links[0] {
            ${LINKS}
        },
        image {
            ${IMAGE}
        },
        altText,
        hideCta
    },
    imageLoading,
    title,
    subheading,
`;
