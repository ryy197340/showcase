import clsx from 'clsx';
import {v4 as uuidv4} from 'uuid';

import Module from '~/components/modules/Module';
import ProductCard from '~/components/product/Card';
import type {CustomModule, SanityModule} from '~/lib/sanity';
import type {ProductWithNodes} from '~/types/shopify';

// Sanity modules to render in full width (across all grid columns)
const FULL_WIDTH_MODULE_TYPES: SanityModule['_type'][] = [
  'module.callout',
  'module.calloutButton',
  'module.callToAction',
  'module.catalog',
  'module.columnsOfProducts',
  'module.gorgiasChatButton',
  'module.guideProduct',
  'module.quoteBanner',
  'module.shopByCollection',
  'module.featuredBlogPosts',
  'module.featuredCollection',
  'module.featuredFabric',
  'module.featuredProducts',
  'module.heroFullWidth',
  'module.image',
  'module.imageGrid',
  'module.imageWithText',
  'module.imagesWithTextRow',
  'module.threeImagesModule',
  'module.textModule',
  'module.columnsOfTextModule',
  'module.oneTrustGDPRDoNotSell',
  'module.promoProducts',
  'module.singleTestimonial',
  'module.jotForm',
  'module.listColumns',
  'module.letsGetStyled',
  'module.tableData',
  'module.featuredProductsGrid',
  'module.featuredProductsGridHomepage',
  'module.pureHTML',
  'heroCarousel',
  'carousel',
];

type Props = {
  items: (SanityModule | ProductWithNodes)[];
  isProductGrid?: boolean;
  isBlogGrid?: boolean;
  isBlogModule?: boolean;
};

const isModule = (
  item: SanityModule | CustomModule | ProductWithNodes,
): item is SanityModule => {
  return (
    (item as SanityModule)._type?.startsWith('module') ||
    (item as SanityModule)._type === 'heroCarousel' ||
    (item as SanityModule)._type === 'carousel'
  );
};

export default function ModuleGrid({
  items,
  isProductGrid,
  isBlogGrid,
  isBlogModule,
}: Props) {
  return (
    <ul
      className={
        isProductGrid
          ? 'product-grid-content grid grid-cols-2 gap-x-[5px] gap-y-[37px] md:grid-cols-3 lg:grid-cols-4'
          : isBlogGrid
          ? 'blog-grid-content h-[690px] gap-5'
          : 'module-grid-content flex flex-col gap-y-[20px] pb-8 md:gap-y-15'
      }
    >
      {items?.map((item, i) => {
        if (isModule(item)) {
          // Detect shelfHeaders module with hideOnMobile flag
          const isShelfHeader = item._type === 'module.shelfHeaders';
          const hideOnMobile = isShelfHeader && item?.hideOnMobile;
          // Render modules
          return (
            <li
              className={clsx(
                'flex',
                isBlogGrid && 'w-full',
                item._type === 'module.featuredFabric' && 'featured-fabric',
                item._type !== 'module.featuredCollection' &&
                  item._type !== 'module.completeTheLookRow' &&
                  'overflow-hidden',
                item._type === 'module.columnsOfTextModule' &&
                  'columnsOfTextModule',
                item._type === 'module.pureHTML' && 'pureHTML',
                item._type === 'module.gorgiasChatButton' &&
                  'gorgiasChatButton',
                item._type === 'module.backToLink' && 'backToLink',
                item._type === 'module.image' && 'image-module',
                FULL_WIDTH_MODULE_TYPES.includes(item._type)
                  ? 'md:col-span-2'
                  : 'md:col-span-1',
                hideOnMobile ? 'hidden md:flex' : '',
              )}
              key={item._key}
            >
              <div className={'w-full'}>
                <Module module={item} isBlogModule={isBlogModule} index={i} />
              </div>
            </li>
          );
        } else {
          // FIXME: using uuidv4() to generate a key isn't stable, as the key will change on every render.
          // Render product cards
          return (
            <li key={uuidv4()}>
              <div>
                <ProductCard storefrontProduct={item} />
              </div>
            </li>
          );
        }
      })}
    </ul>
  );
}
