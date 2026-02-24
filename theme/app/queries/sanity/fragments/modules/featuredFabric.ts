import groq from 'groq';

import {IMAGE} from '../image';
import {LINKS} from '../links';

export const FEATURED_FABRIC = groq`
  _type == 'module.featuredFabric' => {
    _key,
    images[] {
      ${IMAGE}
    },
    altText,
    'fabricInfo': fabricInfo {
      heading,
      description,
      bulletPoints,
      internalLinks[0] {
        ${LINKS}
      },
      displayProductInfoLocation,
      displayButtonLocation,
      styles[],
      sideBySideImages[]{
        _key,
        image {
          ${IMAGE}
        },
        imageMobile {
          ${IMAGE}
        },
        imageAltText,
      },
      twoColumnCards[]{
        _key,
        image {
          ${IMAGE}
        },
        imageMobile {
          ${IMAGE}
        },
        heading,
        imageAltText,
        description,
        bulletPoints,
        internalLinks {
          ${LINKS}
        },
        icons[]{
          'iconImage': iconImage.asset->url,
          iconHeading,
          iconDetail
        }
      }
    },
  }
`;
