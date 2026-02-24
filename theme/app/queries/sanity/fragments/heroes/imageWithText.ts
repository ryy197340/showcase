import groq from 'groq';

import {COLOR_THEME} from '../colorTheme';
import {IMAGE} from '../image';
import {LINKS} from '../links';
import {MARK_DEFS} from '../portableText/markDefs';
import {PRODUCT_WITH_VARIANT} from '../productWithVariant';

export const IMAGE_WITH_TEXT = groq`
  _key,
  'imageContent': imageContent {
    desktopImage {
      ${IMAGE}
    },
    mobileImage {
      ${IMAGE}
    },
    altText,
    imageWidth,
    imageLeftOrRight,
  },
  textContent {
    textLeftOrCenter,
    textOverlay {
      textOverlayBoolean,
      textOverlayPosition,
      backgroundTransparency,
      hideOverlayMobile,
    },
    colorTheme->{
      ${COLOR_THEME}
    },
    textFields[] {
      _key,
      _type,
      (_type == 'headingObject') => {
        heading,
        _key,
      },
      (_type == 'subHeadingObject') => {
        subHeading,
        _key,
      },
      (_type == 'descriptionObject') => {
        description,
        _key,
      },
      (_type == 'module.richText') => {
        _key,
        "richTextBody": richTextBody[]{
          ...,
          _type == 'block' => {
            _type,
            _key,
            style,
            markDefs[] {
              ${MARK_DEFS}
            },
            children[]{
              ...,
            }
          },
        },
      },
      (_type == 'stringArrayObject') => {
        strings,
        listType,
        _key,
      },
      (_type == 'linkInternal') => {
        ${LINKS}
      },
    },
  },
  hotspots[] {
          ...,
          _key,
          "product": productWithVariant {
          ...${PRODUCT_WITH_VARIANT}
          },
          x,
          y,
          "relatedProducts": relatedProducts[]{
          ...${PRODUCT_WITH_VARIANT}
          }
      },
  cssClass,
`;
