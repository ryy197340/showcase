import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {IMAGE} from '../image';
import {LINKS} from '../links';
export const HERO_FULL_WIDTH = groq`
  _key,
  _type,
  title,
  subtitle,
  colorTheme->{
    ${COLOR_THEME}
  },
  textLeftOrRight,
  image {
    ${IMAGE}
  },
  imageMobile {
    ${IMAGE}
  },
  altText,
  link {
    ${LINKS}
  },
  link2 {
    ${LINKS}
  },
  linkColorTheme1->{
    ${COLOR_THEME}
  },
  linkColorTheme2->{
    ${COLOR_THEME}
  },
`;
