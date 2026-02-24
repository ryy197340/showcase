import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {IMAGE} from '../image';

export const SINGLE_TESTIMONIAL = groq`
    _type,
    key,
    imagePanel {
       ${IMAGE}
    },
    imagePanelMobile {
       ${IMAGE}
    },
    altText,
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
