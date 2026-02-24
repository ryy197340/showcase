import clsx from 'clsx';

import Copyright from './megaFooter/Copyright';
import FooterContactNav from './megaFooter/FooterContactNav';
import FooterMonogram from './megaFooter/FooterMonogram';
import FooterSignUp from './megaFooter/FooterSignUp';
import MegaFooter from './megaFooter/MegaFooter';
import PolicyNav from './megaFooter/PolicyNav';

/**
 * A component that specifies the content of the footer on the website
 */
interface LayoutProps {
  footerContactNav?: any;
  megaFooter?: {
    monogramText?: string;
    footerNavigation?: any;
  };
  social?: any;
  policyNav?: any;
}

export default function FooterSSR({layout}: {layout: LayoutProps}) {
  const {footerContactNav, megaFooter, social, policyNav} = layout || {};
  // SSR friendly note
  // layout is passed down via props from root.tsx > Layout.tsx
  // This avoids using useMatches which use client side hydration

  // Monogram Text
  const monogramText = megaFooter?.monogramText;

  return (
    <footer className={clsx(['-mt-overlap'])} role="contentinfo">
      {/* Monogram Bar */}
      <FooterMonogram text={monogramText} />

      {/* Sign Up */}
      <FooterSignUp />

      {/* Footer Contact Nav */}
      <FooterContactNav footerContactNav={footerContactNav} />

      {/* MegaFooter */}
      <MegaFooter
        megaFooter={megaFooter?.footerNavigation || {}}
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
