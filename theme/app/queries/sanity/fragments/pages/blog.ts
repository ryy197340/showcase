import groq from 'groq';

import {MODULE_IMAGES} from '../modules/images';

export const PAGE = groq`
  _type,
  title,
  slug,
  category,
  _createdAt,
  "richTextBody": richTextBody[]{
    ...,
    _type == 'module.richText' => {
      _type,
      _key,
      "richTextBody": richTextBody[]{
        ...,
        _type == 'block' => {
          _type,
          _key,
          style,
          markDefs[] {
            ...,
          },
          children[]{
            ...,
          }
        },
        (_type == 'blockImages' || _type == 'module.images') => {
            '_type': 'module.images',
            ${MODULE_IMAGES}
        },
      },
      columnWidth
    }
  }
`;
