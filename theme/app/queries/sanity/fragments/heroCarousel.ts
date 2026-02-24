import groq from 'groq';

import {IMAGE} from './image';
import {LINK_INTERNAL} from './linkInternal';
import {VIDEOWISE_HTML} from './modules/videowiseHTML';
import {PORTABLE_TEXT} from './portableText/portableText';

export const HERO_CAROUSEL = groq`
  interval,
  carouselHeight,
  'slides': slides[] {
    _key,
    _type,
    ...select(
      _type == 'videoSlide' => {
        ${VIDEOWISE_HTML}
      },
      {
        'images': images[] {
          ...,
          "outsideContionTest": "outsideContionTest",
          (_type == 'color') => {
            type,
            alpha,
            hex,
            rgb,
          },
          (_type == 'slideImage') => {
            'image': image{
              ...,
              "imageTest": "imageTest",
              "altText": asset->altText,
              "blurDataURL": asset->metadata.lqip,
              'height': asset->metadata.dimensions.height,
              'url': asset->url,
              'width': asset->metadata.dimensions.width,
            },
            'mobileImage': mobileImage{
              ...,
              "mobileImageTest": "mobileImageTest",
              "altText": asset->altText,
              "blurDataURL": asset->metadata.lqip,
              'height': asset->metadata.dimensions.height,
              'url': asset->url,
              'width': asset->metadata.dimensions.width,
            }, 
            'slideImages': {
              'image': image{
                ${IMAGE}
              },
              'mobileImage': mobileImage{
                ${IMAGE}
              },
              altText,
            },
          },
        },
        html,
        'link': link{
          ${LINK_INTERNAL}
        },
        'heading': heading[]{
          ${PORTABLE_TEXT}
        },
        subHeading,
        'additionalText': additionalText[]{
          ${PORTABLE_TEXT}
        },
        'textColor': textColor{
          alpha,
          hex,
          rgb,
        },
        verticalOrientation,
        contentSlide,
        hideTitle
      }
    )
  }
`;
