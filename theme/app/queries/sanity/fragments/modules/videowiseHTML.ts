import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';

export const VIDEOWISE_HTML = groq`
    _key,
    _type,
    playButton,
    buttonTheming->{
        ${COLOR_THEME}
    },
    html,
    mobileHTML,
    index,
    page,
    hideMobile,
    hideTablet,
    hideDesktop,
    widthRadio,
    widthMobileRadio
`;
