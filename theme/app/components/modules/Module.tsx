import {useCallback, useEffect, useRef} from 'react';

import BackToLink from '~/components/modules/BackToLink';
import CalloutModule from '~/components/modules/Callout';
import CalloutModuleButton from '~/components/modules/CalloutButton';
import CallToActionModule from '~/components/modules/CallToAction';
import CatalogImage from '~/components/modules/CatalogImage';
import CatalogRowOfImages from '~/components/modules/CatalogRowOfImages';
import CollectionModule from '~/components/modules/Collection';
import ColumnsOfProducts from '~/components/modules/ColumnsOfProducts';
import ColumnsOfTextModule from '~/components/modules/ColumnsOfTextModule';
import CompleteTheLook from '~/components/modules/CompleteTheLook';
import CompleteTheLookRow from '~/components/modules/CompleteTheLookRow';
import FeaturedBlogPosts from '~/components/modules/FeaturedBlogPosts';
import FeaturedCollection from '~/components/modules/FeaturedCollection';
import FeaturedFabric from '~/components/modules/FeaturedFabric';
import FeaturedProducts from '~/components/modules/FeaturedProducts';
import FeaturedProductsGrid from '~/components/modules/FeaturedProductsGrid';
import FourImagesModule from '~/components/modules/FourImagesModule';
import GorgiasChatButton from '~/components/modules/GorgiasChatButton';
import GuideProduct from '~/components/modules/GuideProduct';
import ImageModule from '~/components/modules/Image';
import ImageWithText from '~/components/modules/ImageWithText';
import InstagramModule from '~/components/modules/Instagram';
import JotFormModule from '~/components/modules/JotFormModule';
import LetsGetStyled from '~/components/modules/LetsGetStyled';
import ListColumns from '~/components/modules/ListColumns';
import OneTrustGDPRDoNotSell from '~/components/modules/OneTrustGDPRDoNotSell';
import ProductModule from '~/components/modules/Product';
import PromoProducts from '~/components/modules/PromoProducts';
import QuoteBanner from '~/components/modules/QuoteBanner';
import RichTextModule from '~/components/modules/RichText';
import ShopByCollection from '~/components/modules/ShopByCollection';
import SingleTestimonial from '~/components/modules/SingleTestimonial';
import ColumnsOfStylistsModule from '~/components/modules/StylistsModule';
import Table from '~/components/modules/Table';
import TextModule from '~/components/modules/TextModule';
import ThreeImagesModule from '~/components/modules/ThreeImagesModule';
import {useHydration} from '~/hooks/useHydration';
import type {CustomModule, SanityModule} from '~/lib/sanity';

import HeroCarousel from './Carousel/HeroCarousel';
import CatalogImageNew from './CatalogImageNew';
import CatalogSlider from './CatalogSlider';
import FeaturedProductsGridHomepage from './FeaturedProductsGridHomepage';
import HeroFullWidth from './HeroFullWidth';
import ImageGrid from './ImageGrid';
import ImagesWithTextRow from './ImagesWithTextRow';
import PodSlider from './PodSlider';
import PureHtml from './PureHtml';
import ShelfHeadersModule from './ShelfHeaders';
import VideowiseHTMLModule from './VideowiseHTML';

type Props = {
  imageAspectClassName?: string;
  module: SanityModule | CustomModule;
  isBlogModule?: boolean;
  index?: number;
};

function processImg(html: string) {
  html = html.replace(
    /(<source\s[^>]*)loading\s*=\s*["'][^"']*["']/gi,
    '$1loading="lazy"',
  );
  html = html.replace(/(<source\s[^>]*)srcset\s*=/gi, '$1data-srcset=');

  html = html.replace(
    /(<img\s[^>]*)loading\s*=\s*["'][^"']*["']/gi,
    '$1loading="lazy"',
  );
  html = html.replace(/(<img\s[^>]*)src\s*=\s*(?!set)/gi, '$1 data-src=');
  html = html.replace(/(<img\s[^>]*)srcset\s*=/gi, '$1data-srcset=');

  html = html.replace(
    /<div([^>]*?)(?:\s+style=["']([^"']*)["'])?([^>]*?)>/gi,
    (match, before, existingStyle, after) => {
      // Check if this div has "mobile-image-top" class
      const fullAttributes = before + after;
      if (
        /class=["'][^"']*\bmobile-image-top\b[^"']*["']/i.test(fullAttributes)
      ) {
        return match; // Return unchanged
      }

      // Check if this div has "image-x" class (where x is a number)
      if (!/class=["'][^"']*\bimage-\d+\b[^"']*["']/i.test(fullAttributes)) {
        return match; // Return unchanged if no image-x class found
      }

      const newStyle = existingStyle
        ? `${existingStyle}; background-image: none;`
        : 'background-image: none;';

      return `<div${before} style="${newStyle}"${after}>`;
    },
  );

  return html;
}

function processVideo(html: string, isHydrated: boolean) {
  // On SSR, don't load the video, the poster image will be loaded instead
  if (!isHydrated) {
    html = html.replace(/(<video\s[^>]*)\ssrc\s*=\s*(?!set)/gi, '$1 data-src=');
  } else {
    html = html.replace(/(<video\s[^>]*)\sdata-src\s*=\s*/gi, '$1 src=');
  }

  return html;
}

export default function Module({
  imageAspectClassName,
  module,
  isBlogModule,
  index,
}: Props) {
  const isHydrated = useHydration();
  const intersectionObserverCb = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      if (!entry.isIntersecting) {
        return;
      }

      const target = entry.target as HTMLDivElement;

      const images = target.querySelectorAll(
        'img[data-src]',
      ) as NodeListOf<HTMLImageElement>;
      if (images.length > 0) {
        images.forEach((img) => {
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');

          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
        });
      }

      const sources = target.querySelectorAll(
        'source[data-srcset]',
      ) as NodeListOf<HTMLSourceElement>;
      if (sources.length > 0) {
        sources.forEach((source) => {
          if (source.dataset.srcset) {
            source.srcset = source.dataset.srcset;
            source.removeAttribute('data-srcset');
          }
        });
      }

      const elementsWithBgImageRemoved = target.querySelectorAll(
        '[style*="background-image: none"]',
      ) as NodeListOf<HTMLElement>;
      if (elementsWithBgImageRemoved.length > 0) {
        elementsWithBgImageRemoved.forEach((element) => {
          element.style.removeProperty('background-image');
        });
      }
    },
    [],
  );

  const intersectionObserverRef = useRef<IntersectionObserver | undefined>();
  const nodeRef = useRef<HTMLElement | undefined>();

  const containerRefSetter = useCallback(
    (node: HTMLDivElement) => {
      if (!node) {
        return;
      }

      if (intersectionObserverRef.current && nodeRef.current) {
        intersectionObserverRef.current.unobserve(nodeRef.current);
        intersectionObserverRef.current.disconnect();
      }

      intersectionObserverRef.current = new IntersectionObserver(
        intersectionObserverCb,
        {
          rootMargin: '422px 0px',
        },
      );

      nodeRef.current = node;
      intersectionObserverRef.current.observe(nodeRef.current);
    },
    [intersectionObserverCb],
  );

  useEffect(() => {
    return () => {
      if (!intersectionObserverRef.current || !nodeRef.current) {
        return;
      }

      intersectionObserverRef.current.unobserve(nodeRef.current);
      intersectionObserverRef.current.disconnect();
    };
  }, []);

  switch (module._type) {
    case 'heroCarousel':
      return <HeroCarousel content={module} />;
    case 'module.backToLink':
      return <BackToLink content={module} />;
    case 'module.quoteBanner':
      return <QuoteBanner module={module} />;
    case 'module.shopByCollection':
      return <ShopByCollection module={module} />;
    case 'module.featuredBlogPosts':
      return <FeaturedBlogPosts module={module} />;
    case 'module.featuredCollection':
      return <FeaturedCollection module={module} />;
    case 'module.featuredFabric':
      return <FeaturedFabric module={module} index={index} />;
    case 'module.featuredProducts':
      return <FeaturedProducts module={module} />;
    case 'module.gorgiasChatButton':
      return <GorgiasChatButton module={module} />;
    case 'module.guideProduct':
      return <GuideProduct module={module} />;
    case 'module.heroFullWidth':
      return <HeroFullWidth module={module} />;
    case 'module.imageWithText':
      return <ImageWithText content={module} />;
    case 'module.jotForm':
      return <JotFormModule module={module} />;
    case 'module.threeImagesModule':
      return <ThreeImagesModule module={module} />;
    case 'module.imagesWithTextRow':
      return <ImagesWithTextRow module={module} />;
    case 'module.fourImagesModule':
      return <FourImagesModule module={module} />;
    case 'module.textModule':
      return <TextModule content={module} key={module._key} />;
    case 'module.columnsOfTextModule':
      return <ColumnsOfTextModule content={module} />;
    case 'module.columnsOfProducts':
      return <ColumnsOfProducts module={module} />;
    case 'module.promoProducts':
      return <PromoProducts module={module} />;
    case 'module.callout':
      return <CalloutModule module={module} />;
    case 'module.calloutButton':
      return <CalloutModuleButton module={module} />;
    case 'module.callToAction':
      return <CallToActionModule module={module} />;
    case 'module.catalogImage':
      return <CatalogImage module={module} />;
    case 'module.catalogRowOfImages':
      return <CatalogRowOfImages module={module} />;
    case 'module.catalogSlider':
      return <CatalogSlider module={module} />;
    case 'module.collection':
      return <CollectionModule module={module} />;
    case 'module.columnsOfStylistsModule':
      return <ColumnsOfStylistsModule module={module} />;
    case 'module.image':
      return <ImageModule module={module} isBlogModule={isBlogModule} />;
    case 'module.catalogImageNew':
      return <CatalogImageNew module={module} />;
    case 'module.instagram':
      return <InstagramModule module={module} />;
    case 'module.oneTrustGDPRDoNotSell':
      return <OneTrustGDPRDoNotSell content={module} />;
    case 'module.singleTestimonial':
      return <SingleTestimonial module={module} />;
    case 'module.listColumns':
      return <ListColumns module={module} />;
    case 'module.letsGetStyled':
      return <LetsGetStyled module={module} />;
    case 'module.tableData':
      return <Table content={module} />;
    case 'module.podSlider':
      return <PodSlider module={module} />;
    case 'module.richText':
      return <RichTextModule module={module} />;
    case 'module.featuredProductsGrid':
      return <FeaturedProductsGrid module={module} />;
    case 'module.completeTheLook':
      return <CompleteTheLook module={module} />;
    case 'module.completeTheLookRow':
      return <CompleteTheLookRow module={module} />;
    case 'module.featuredProductsGridHomepage':
      return <FeaturedProductsGridHomepage module={module} />;
    case 'module.shelfHeaders':
      return <ShelfHeadersModule module={module} />;
    case 'module.videowiseHTML':
      return <VideowiseHTMLModule module={module} />;
    case 'module.pureHTML':
      return <PureHtml html={module.html} />;
    case 'module.imageGrid':
      return <ImageGrid module={module} />;
    case 'module.product':
      return (
        <ProductModule
          imageAspectClassName={imageAspectClassName}
          module={module}
        />
      );
    default:
      return null;
  }
}
