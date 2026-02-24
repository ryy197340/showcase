import {useLocation, useMatches} from '@remix-run/react';
import clsx from 'clsx';

import {useHydration} from '~/hooks/useHydration';

import FooterSSR from './FooterSSR';
import Copyright from './megaFooter/Copyright';
import FooterContactNav from './megaFooter/FooterContactNav';
import FooterMonogram from './megaFooter/FooterMonogram';
import FooterSignUp from './megaFooter/FooterSignUp';
import MegaFooter from './megaFooter/MegaFooter';
import PolicyNav from './megaFooter/PolicyNav';

/**
 * A component that specifies the content of the footer on the website
 */
function FooterCSR() {
  const [root] = useMatches();
  const layout = root.data?.layout;
  const {footerContactNav, megaFooter, social, policyNav} = layout || {};
  const location = useLocation();
  // Monogram Text
  const monogramText = megaFooter?.monogramText;

  const addHeight =
    location.pathname.includes('/products/') ||
    location.pathname.includes('/cart');

  return (
    <footer
      className={clsx(['-mt-overlap', addHeight && 'mb-[132px] md:mb-0'])}
      role="contentinfo"
    >
      {/* Monogram Bar */}
      <FooterMonogram text={monogramText} />

      {/* Sign Up */}
      <FooterSignUp />

      {/* Footer Contact Nav */}
      <FooterContactNav footerContactNav={footerContactNav} />

      {/* MegaFooter */}
      <MegaFooter
        megaFooter={megaFooter?.footerNavigation}
        socialLinks={social}
      />

      <div className="border-t border-lightGray">
        <div className="page-width flex flex-row items-center justify-between py-4 text-2xs">
          <span id="accessibilityMenu" className="hidden md:block md:pl-2">
            Accessibility Menu
          </span>
          {/* Policy Nav */}
          <PolicyNav policyNav={policyNav} />
        </div>
      </div>
      <Copyright />
    </footer>
  );
}

export default function Footer(props: any) {
  const isHydrated = useHydration();
  return (
    <>{isHydrated ? <FooterCSR {...props} /> : <FooterSSR {...props} />}</>
  );
}
