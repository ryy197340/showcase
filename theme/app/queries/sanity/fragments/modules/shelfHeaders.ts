import groq from 'groq';

import {LINK_INTERNAL} from '../linkInternal';

export const SHELF_HEADERS = groq`
    _type,
    hideOnMobile,
    links[] {
        ...${LINK_INTERNAL}
    }
`;
