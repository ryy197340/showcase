import groq from 'groq';

import {TEXT} from '../heroes/text';
import {IMAGE} from '../image';
import {LINK_INTERNAL} from '../linkInternal';
import {PRODUCT_WITH_VARIANT} from '../productWithVariant';

export const CATALOG_IMAGE_NEW = groq`
    _type,
    _key,
    image{
      ${IMAGE}
    },
    imageMobile{
      ${IMAGE}
    },
    altText,
    textAbove {
        ${TEXT}
    },
    textOverlay {
        ${TEXT}
    },
    overlayPositionDesktop {
      x,
      y
    },
    overlayPositionMobile {
      x,
      y
    },
    overlayAlignment,
    overlaySnap,
    textBelow {
        ${TEXT}
    },
    variant,
    hotspots[] {
        ...,
        _key,
        "product": productWithVariant {
          ...${PRODUCT_WITH_VARIANT}
        },
        x,
        y,
        "relatedProducts": relatedProducts[] {
          ...${PRODUCT_WITH_VARIANT}
        }
    },
    internalLink {
        ${LINK_INTERNAL}
    },
    styleDesktop {
        padding {
            top,
            right,
            bottom,
            left
        },
        margin {
            top,
            right,
            bottom,
            left
        },
        objectFit
    },
    styleMobile {
        padding {
            top,
            right,
            bottom,
            left
        },
        margin {
            top,
            right,
            bottom,
            left
        },
        objectFit
    }
`;
