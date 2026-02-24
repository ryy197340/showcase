import groq from 'groq';

import {ACTION_GRID} from './actionGrid';
import {IMAGE_COLUMN} from './imageColumn';
import {LINK_LIST_COLUMN} from './linkListColumn';
import {SINGLE_COLUMN_TWO_LINKLISTS} from './singleColumnTwoLinklists';
import {SINGLE_COLUMN_VIDEOWISE} from './singleColumnVideowise';

export const SUB_NAV_COLUMN = groq`
      _type,
      _key,
      (_type == 'column') => {
        ${LINK_LIST_COLUMN}
      },
      (_type == 'singleColumnTwoLinkLists') => {
        ${SINGLE_COLUMN_TWO_LINKLISTS}
      },
      (_type == 'featuredImage' || _type == '2xfeaturedImage') => {
        columnWidth,
        ${IMAGE_COLUMN}
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
      (_type == 'FeaturedImageGrid') => {
        gridTitle,
        imageAspectRatio,
        gridTitleAlignment,
        gridDimensions,
        columnWidth,
        rowContent[] {
        _key,
        _type,
        ${IMAGE_COLUMN}
        },
      },
      (_type == 'actionGrid') => {
        ${ACTION_GRID}
      },
      (_type == 'singleColumnVideowise') => {
       ${SINGLE_COLUMN_VIDEOWISE}
      }
`;
