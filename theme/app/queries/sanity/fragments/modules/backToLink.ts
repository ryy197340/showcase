import groq from 'groq';

import {IMAGE} from '../image';
import {LINK_INTERNAL} from '../linkInternal';
import {LINKS} from '../links';

export const MODULE_BACK_TO_LINK = groq`
    
        internalLinks {
            ${LINKS}
        },
        image {
            ${IMAGE}
        },
    
`;
