import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {IMAGE} from '../image';

export const MODULE_SINGLE_TESTIMONIAL = groq`
    _type,
    _key,
    imagePanel {
        ${IMAGE}
    },
    imagePanelMobile {
        ${IMAGE}
    },
    quotationPanel {
        quoteTextFields {
            quote,
            jobTitle,
            name
        },
        colorTheme->{
            ${COLOR_THEME}
        }
    }
`;
