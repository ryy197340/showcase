import {useLocation, useMatches} from '@remix-run/react';
import {type ReactNode} from 'react';

import Footer from '~/components/global/Footer';
import Header from '~/components/global/Header';
import LocalizedA from '~/components/global/LocalizedA';
import ScrollToTop from '~/components/global/ScrollToTop';
import {PreviewBanner} from '~/components/preview/PreviewBanner';

type LayoutProps = {
  backgroundColor?: string;
  isPreviewEnabled?: boolean;
  children: ReactNode;
  layout?: any;
};

function LayoutCSR({
  backgroundColor,
  isPreviewEnabled,
  layout,
  children,
}: LayoutProps) {
  const [root] = useMatches();
  const location = useLocation();

  const sanityLayout = root.data?.layout;
  const sanityTransparentHeader = sanityLayout?.transparentHeader ?? false;
  const isHomePage = location.pathname === '/';
  const transparentHeader = sanityTransparentHeader && isHomePage;

  return (
    <>
      <div className="absolute left-0 top-0">
        <LocalizedA
          href="#mainContent"
          className="sr-only p-4 focus:not-sr-only focus:block"
        >
          Skip to content
        </LocalizedA>
      </div>

      <div
        className={`max-w-screen flex min-h-screen flex-col ${
          transparentHeader ? 'lg:relative' : ''
        }`}
        style={{background: backgroundColor}}
      >
        <Header transparentHeader={transparentHeader} />

        <ScrollToTop />
        <main
          className={`relative grow ${transparentHeader ? 'lg:mt-[75px]' : ''}`}
          id="mainContent"
        >
          <div className="mx-auto pb-overlap">{children}</div>
        </main>
      </div>

      <Footer layout={layout} />

      {isPreviewEnabled && <PreviewBanner />}
    </>
  );
}

export default LayoutCSR;
