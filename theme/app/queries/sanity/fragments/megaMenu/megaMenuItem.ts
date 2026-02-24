import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {LINK_INTERNAL} from '../linkInternal';
import {LINKS} from '../links';
import {IMAGE_COLUMN} from './imageColumn';
import {SUB_NAV_COLUMN} from './subNavColumn';

export const MEGA_MENU_ITEM = groq`
  (_type == 'singleNavigationItem') => {
    _type,
    _key,
    linkList[] {
      ${LINKS}
    },
  },
  (_type == 'subNavigationMenu') => {
    _type,
    _key,
    subNavTitle,
    navTitleLink {
      ${LINK_INTERNAL}
    },
    linkList[] {
      ${LINKS}
    },
    subNavColumns[]{
      ${SUB_NAV_COLUMN}
    },
    dropdownColorTheme->{
      ${COLOR_THEME}
    },
  },
  (_type == 'dropdownMobileImageGrid') => {
    _key,
    _type,
    title,
    rowContent[] {
      _key,
      _type,
      ${IMAGE_COLUMN}
    },
  },
`;
