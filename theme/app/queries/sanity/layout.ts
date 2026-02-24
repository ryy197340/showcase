import groq from 'groq';

import {ANNOUNCEMENTS} from './fragments/announcements';
import {FOOTER_UTILITIES} from './fragments/footerUtilities';
import {IMAGE} from './fragments/image';
import {LINKS} from './fragments/links';
import {MEGA_FOOTER} from './fragments/megaFooter';
import {MEGA_MENU_ITEM} from './fragments/megaMenu/megaMenuItem';
import {OPT_IN_LANGUAGE} from './fragments/modules/optInLanguage';
import {POD_SLIDER} from './fragments/modules/podSlider';
import {NOT_FOUND_PAGE} from './fragments/notFoundPage';
import {STORE_LOCATOR_LINK} from './fragments/storeLocatorLink';
export const LAYOUT_QUERY = groq`
  *[_type == 'settings'] | order(_updatedAt desc) [0] {
    seo,
    "menuLinks": menu.links[] {
      ${LINKS}
    },
    headerLogo {
      ${IMAGE}
    },
    announcements {
      ${ANNOUNCEMENTS}
    },
    transparentHeader,
    "storeLocatorLink": storeLocatorLink[0] {
      ${STORE_LOCATOR_LINK}
    },
    "megaMenu": megaMenu.headerNavigation[]{
      ${MEGA_MENU_ITEM}
    },
    "policyNav": policyNav.links[] {
      ${LINKS}
    },
    "helpNav": helpNav.links[] {
      ${LINKS}
    },
    "footerContactNav" : footerUtilities {
      ${FOOTER_UTILITIES}
    },
    social,
    "tooltipNav": tooltipNav.links[] {
      ${LINKS}
    },   
    "megaFooter": megaFooter {
      ${MEGA_FOOTER}
    },
    notFoundPage {
      ${NOT_FOUND_PAGE}
    },
    "cartPods": cartPods[] {
      ${POD_SLIDER}
    },
    "cartDrawerPod" : cartDrawerPod[] {
      ${POD_SLIDER}
    },
    "restingSearchPod" : restingSearchPod[] {
      ${POD_SLIDER}
    },
    "suggestedSearchTerms" : suggestedSearchTerms.terms[],
    "fallbackPodId": fallbackPodId,
    "optInLanguage": ${OPT_IN_LANGUAGE},
    giftSettings {
      giftCopy,
      giftHeader,
      giftImage {
      ${IMAGE}
      }
    }
  }
`;
