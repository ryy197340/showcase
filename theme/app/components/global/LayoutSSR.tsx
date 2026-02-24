import Footer from '~/components/global/Footer';
import Header from '~/components/global/Header';
import {PreviewBanner} from '~/components/preview/PreviewBanner';

import LocalizedA from './LocalizedA';
import ScrollToTop from './ScrollToTop';

type LayoutProps = {
  backgroundColor?: string;
  preview?: any;
  children: React.ReactNode;
  layout?: any;
};

export default function LayoutSSR({
  backgroundColor,
  preview,
  layout,
  children,
}: LayoutProps) {
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
        className="max-w-screen flex min-h-screen flex-col"
        style={{background: backgroundColor}}
      >
        <Header stickyHeader={'visible'} layout={layout} />
        <ScrollToTop />
        <main className="relative grow" id="mainContent" role="main">
          <div className="mx-auto pb-overlap">{children}</div>
        </main>
      </div>

      <Footer layout={layout} />

      {preview ? <PreviewBanner /> : <></>}
    </>
  );
}
