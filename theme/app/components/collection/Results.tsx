import {useLocation} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import {SearchProduct} from '@xgenai/sdk-core/dist/types/search';
import {useContext, useEffect, useMemo, useState} from 'react';

import RichTextModule from '~/components/modules/RichText';
import CioProductCard from '~/components/product/CioCard';
import {
  CatalogImageNew as CatalogImageNewType,
  CatalogRowOfImages as CatalogRowOfImagesType,
  SlottedContentItem,
  VideowiseHTML,
} from '~/lib/sanity/types';
import {CollectionFiltersContext} from '~/routes/($lang).collections.$handle';
import {SearchFiltersContext} from '~/routes/($lang).search';
import {LoadStatus} from '~/utils/constants';

import Link from '../elements/Link';
import CatalogImageNew from '../modules/CatalogImageNew';
import CatalogRowOfImages from '../modules/CatalogRowOfImages';

interface SlottedCollectionItem {
  type: 'slot' | 'product' | 'alternatingHeroSlot';
  index: number;
  content:
    | SlottedContentItem
    | SearchProduct
    | CatalogRowOfImagesType
    | CatalogImageNewType
    | VideowiseHTML;
}

type Props = {
  items: SearchProduct[];
  dataAttributes: any;
  products: any;
  setProducts: any;
  loadStatus: LoadStatus;
  error: any;
  altGrid: any;
};

// This hook will set the height of slotted content items based on the tallest non-slotted content item
const useDynamicHeight = (slottedContentItems: unknown) => {
  const [nonSlottedContentHeight, setNonSlottedContentHeight] =
    useState<number>(425);

  // Calculate the height of the tallest non-slotted content item
  useEffect(() => {
    const nonSlottedContentElementsAll =
      document.querySelectorAll('.not-slot-item');

    let tallestHeight = 0;

    if (nonSlottedContentElementsAll) {
      nonSlottedContentElementsAll.forEach((singleSlot) => {
        tallestHeight = Math.max(
          tallestHeight,
          (singleSlot as HTMLElement).offsetHeight,
        );
      });
      setNonSlottedContentHeight(tallestHeight);
    }
  }, [slottedContentItems]);
  return nonSlottedContentHeight;
};

function filterSlottedContent(
  slottedContent:
    | SlottedContentItem[]
    | CatalogRowOfImagesType[]
    | VideowiseHTML[],
) {
  return slottedContent?.filter(
    (slot: SlottedContentItem | CatalogRowOfImagesType | VideowiseHTML) => {
      if (slot._type === 'content') {
        return !(
          (slot.hideMobile && slot.hideTablet && slot.hideDesktop) ||
          (!slot.image && !slot.richTextBody)
        );
      }
      if (slot._type === 'catalogRowOfImages') {
        return slot.images.length !== 0;
      }
      if (slot._type === 'videowiseHTML') {
        return !!slot.html; // Ensure a boolean value
      }

      return false; // Explicitly remove unexpected types
    },
  );
}

// This component is relying only on XGEN "items"
export default function Results(props: Props) {
  const {items, dataAttributes, products, setProducts, altGrid} = props;
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hasFilters = Array.from(searchParams.keys()).some((key) =>
    key.startsWith('filters'),
  );
  const {
    slottedContent,
    resultsPage,
    view: collectionView,
  } = useContext(CollectionFiltersContext) || {};
  const {view: searchView} = useContext(SearchFiltersContext) || {};

  const view = collectionView ?? searchView;

  const combinedItems: SlottedCollectionItem[] = items.map(
    (item: SearchProduct, index: number) => ({
      type: 'product',
      index: index + 1,
      content: item,
    }),
  );

  const filteredSlottedContent = useMemo(
    () => filterSlottedContent(slottedContent),
    [slottedContent],
  );

  if (filteredSlottedContent && !hasFilters) {
    // Insert filteredSlottedContent into the combinedItems array at the correct index
    filteredSlottedContent.forEach(
      (slot: SlottedContentItem | CatalogRowOfImagesType | VideowiseHTML) => {
        // Find the actual index to insert the slot considering existing slots
        const indexToInsert = combinedItems.findIndex(
          (ci) => ci.index >= slot.index,
        );

        // Insert the slot at the correct index
        combinedItems.splice(
          indexToInsert !== -1 ? indexToInsert : combinedItems.length,
          0,
          {
            type: 'slot',
            index: slot.index,
            content: slot,
          },
        );

        // Increment the index of items after the inserted slot
        for (let i = indexToInsert + 1; i < combinedItems.length; i++) {
          combinedItems[i].index++;
        }
      },
    );
  }

  // Sort combinedItems by index
  combinedItems.sort((a, b) => a.index - b.index);

  // Adjust the index of each item in the combinedItems array
  combinedItems.forEach((item, i) => {
    item.index = i + 1;
  });

  // Handle alternating hero layout
  const alternatingHeroLayout = altGrid?.alternatingHeroLayout;
  const isAlternatingHero = !!(
    alternatingHeroLayout?.enabled && alternatingHeroLayout?.content?.length > 0
  );

  if (isAlternatingHero && !hasFilters) {
    const heroContent = alternatingHeroLayout.content;
    const newCombined: SlottedCollectionItem[] = [];
    let productCount = 0;
    let contentIndex = 0;

    for (const item of combinedItems) {
      newCombined.push(item);
      if (item.type === 'product') {
        productCount++;
        if (productCount % 5 === 0 && productCount < items.length) {
          const catalogContent = heroContent[contentIndex % heroContent.length];
          newCombined.push({
            type: 'alternatingHeroSlot',
            index: 0,
            content: catalogContent,
          });
          contentIndex++;
        }
      }
    }

    // Reassign indices
    newCombined.forEach((item, i) => {
      item.index = i + 1;
    });

    combinedItems.length = 0;
    combinedItems.push(...newCombined);
  }

  // Pre-compute double-size indices for alternating hero layout
  const alternatingHeroDoubleIndices = new Set<number>();
  if (isAlternatingHero) {
    let productCount = 0;
    combinedItems.forEach((item, idx) => {
      if (item.type === 'product') {
        productCount++;
        if (productCount % 5 === 3) {
          alternatingHeroDoubleIndices.add(idx);
        }
      }
    });
  }

  const nonSlottedContentHeight = useDynamicHeight(filteredSlottedContent);

  return (
    <div
      className={`mt-3 flex grow flex-row ${alternatingHeroLayout ? '' : ''}`}
    >
      <div
        id="search-results"
        //change the grid cols to be repeat 1 if the big image attribute is present, if it's small image then small images
        className={`mb-4 grid w-full auto-rows-max ${
          view === 1 ? 'grid-cols-1' : 'grid-cols-2 gap-x-[10px]'
        } flex-col flex-wrap place-content-center items-start justify-around sm:flex-row md:grid-cols-[repeat(12,3fr)] md:items-start md:justify-between lg:grid-cols-[repeat(12,3fr)] ${
          isAlternatingHero ? ' lg:grid-cols-[repeat(13,3fr)]' : ''
        } md:grid-cols-[repeat(13,3fr)]`}
        {...dataAttributes}
      >
        {combinedItems?.map((item: SlottedCollectionItem, index: number) => {
          if (item.type === 'product') {
            const productItem = item.content as SearchProduct;
            if (!productItem || !productItem.content) return null;
            const altGridManualProduct = altGrid?.altGridProducts?.some(
              (ref) => ref._ref === `shopifyProduct-${productItem.prod_code}`,
            );
            const altGridPattern = !!(
              altGrid?.every2rows &&
              (() => {
                const cyclePosition = (index + 1) % 10;
                return cyclePosition === 9 || cyclePosition === 0;
              })()
            );
            const alternatingHeroDouble =
              isAlternatingHero && alternatingHeroDoubleIndices.has(index);
            const doubleSizeCard =
              ((altGridPattern || altGridManualProduct) && altGrid?.altGrid) ||
              alternatingHeroDouble;

            return (
              <div
                key={`${productItem.prod_id}_${productItem?.prod_code}_${index}`}
                className={`${
                  doubleSizeCard
                    ? `col-span-2 md:col-span-6 md:row-span-2 ${
                        alternatingHeroDouble
                          ? 'md:col-span-7 md:self-start'
                          : 'mx-auto md:mx-[10%] md:mb-auto md:mt-auto'
                      }`
                    : 'md:col-span-3'
                }`}
              >
                <CioProductCard
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${productItem.prod_id}_${productItem?.prod_code}_${index}`}
                  index={index}
                  title={productItem.value}
                  data={productItem}
                  labels={productItem?.labels}
                  products={products}
                  setProducts={setProducts}
                  loading={index < 8 ? 'eager' : 'lazy'}
                  doubleSizeCard={doubleSizeCard}
                />
              </div>
            );
          } else if (
            item.type === 'slot' &&
            resultsPage ===
              (
                item.content as
                  | SlottedContentItem
                  | CatalogRowOfImagesType
                  | VideowiseHTML
              ).page
          ) {
            let slotItem:
              | SlottedContentItem
              | CatalogRowOfImagesType
              | VideowiseHTML
              | undefined;
            if (item.content._type === 'content') {
              slotItem = item.content as SlottedContentItem;
            }
            if (item.content._type === 'catalogRowOfImages') {
              slotItem = item.content as CatalogRowOfImagesType;
            }
            if (item.content._type === 'videowiseHTML') {
              slotItem = item.content as VideowiseHTML;
            }
            if (!slotItem) {
              return null;
            }
            // Start with the assumption that the element is visible at all sizes
            let classNames = 'flex md:flex lg:flex'; // Default: visible everywhere

            // Adjust based on conditions
            if (slotItem.hideMobile) {
              classNames = 'hidden md:flex lg:flex'; // Hide only on mobile
            }
            if (slotItem.hideTablet) {
              // Hide on tablet: override md: with hidden, keep lg:flex if not hiding on desktop
              classNames = classNames.replace('md:flex', 'md:hidden');
            }
            if (slotItem.hideDesktop) {
              // Hide on desktop: override lg: with hidden
              classNames = classNames.replace('lg:flex', 'lg:hidden');
            }
            let mobileWidth;
            slotItem.widthMobileRadio === '50 (33% tablet)' ||
            slotItem.widthMobileRadio === null
              ? (mobileWidth = 'col-span-1')
              : (mobileWidth = 'col-span-2 h-full');

            let tabletWidth;
            slotItem.widthMobileRadio === '50 (33% tablet)' ||
            slotItem.widthMobileRadio === null
              ? (tabletWidth = 'md:col-span-4')
              : (tabletWidth = 'md:col-span-full');

            let desktopWidth;
            if (slotItem.widthRadio === '25' || slotItem.widthRadio === null) {
              desktopWidth = 'lg:col-span-3 lg:h-auto';
            } else if (slotItem.widthRadio === '50') {
              desktopWidth = 'lg:col-span-6 lg:h-auto';
            } else {
              desktopWidth = 'lg:col-span-full lg:h-auto';
            }
            return (
              <div
                key={slotItem._key}
                className={`slot-item group relative flex h-full w-full sm:min-h-[332px] lg:overflow-hidden ${mobileWidth} ${tabletWidth} ${desktopWidth} ${classNames}`}
                // Set the height of slotted content items
                style={{
                  height:
                    slotItem._type === 'videowiseHTML'
                      ? 'auto'
                      : slotItem.images &&
                        slotItem.widthMobileRadio !== '50 (33% tablet)'
                      ? '33rem'
                      : `${nonSlottedContentHeight}px`,
                }}
              >
                {slotItem.images && (
                  <CatalogRowOfImages
                    module={slotItem}
                    isSlottedContent={true}
                  ></CatalogRowOfImages>
                )}
                {/* insert videowise module here */}
                {slotItem.html && (
                  <div
                    className="h-full min-h-[217px] w-full object-top lg:max-h-full"
                    dangerouslySetInnerHTML={{__html: slotItem.html}}
                  />
                )}
                {slotItem.image && (
                  <picture
                    className={`flex h-full w-full object-top lg:h-full ${
                      slotItem.imageSize && slotItem.imageSize === 'Image Cover'
                        ? 'object-cover object-center'
                        : slotItem.imageSize &&
                          slotItem.imageSize === 'Image Contain'
                        ? 'object-contain'
                        : ''
                    }`}
                  >
                    <source
                      media="(max-width: 1023px)"
                      srcSet={
                        slotItem.imageMobile
                          ? slotItem.imageMobile.url
                          : slotItem.image.url
                      }
                    />
                    <source
                      media="(min-width: 1024px)"
                      srcSet={slotItem.image.url}
                    />
                    <Image
                      src={slotItem.image.url}
                      alt={slotItem.altText || slotItem.image.altText}
                      loading={index < 8 ? 'eager' : 'lazy'}
                      className={`h-full min-h-[217px] w-full object-top lg:max-h-full ${
                        slotItem.imageSize &&
                        slotItem.imageSize === 'Image Cover'
                          ? 'object-cover'
                          : slotItem.imageSize &&
                            slotItem.imageSize === 'Image Contain'
                          ? 'object-contain'
                          : 'no-size'
                      }`}
                      width={slotItem.image.width}
                      height={slotItem.image.height}
                    />
                  </picture>
                )}
                {slotItem.richTextBody && (
                  <div
                    className={`absolute z-10 flex h-[90%] w-full flex-col items-center justify-center ${
                      slotItem.width === '100' ? 'lg:w-1/2' : ''
                    }`}
                    style={{color: slotItem.colorTheme?.text}}
                  >
                    <div
                      className="text-center lg:px-4"
                      style={{
                        background: !slotItem.backgroundTransparency
                          ? slotItem.colorTheme?.background
                          : '',
                      }}
                    >
                      <RichTextModule module={slotItem} />
                    </div>
                  </div>
                )}
                {slotItem.links && (
                  <Link
                    className={`absolute z-10 flex h-full w-full flex-col items-center justify-center object-contain object-top
                    `}
                    link={slotItem.links}
                  ></Link>
                )}
              </div>
            );
          } else if (item.type === 'alternatingHeroSlot') {
            const catalogContent = item.content as CatalogImageNewType;
            return (
              <div
                key={`alternating-hero-${catalogContent._key}-${index}`}
                className="col-span-2 md:col-span-full"
              >
                <CatalogImageNew module={catalogContent} />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
