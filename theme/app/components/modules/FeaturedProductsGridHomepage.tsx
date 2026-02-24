import {useFetcher} from '@remix-run/react';
import {Collection} from '@shopify/hydrogen/storefront-api-types';
import {EmblaOptionsType} from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import {useContext, useEffect, useRef, useState} from 'react';

import Modal from '~/components/global/ModalCard';
import ProductDetailsCard from '~/components/product/DetailsCardFeaturedCollection';
import {FeaturedCollection as FeaturedCollectionType} from '~/lib/sanity';
import {GlobalContext} from '~/lib/utils';

import {Link} from '../Link';
import PrevNextButtons from '../product/buttons/PrevNextButtons';
import FeaturedProductsCard from '../product/CardFeaturedProducts';
import {usePrevNextButtons} from './EmblaCarouselArrowButtons';

type Props = {
  module: FeaturedCollectionType;
};

const EMBLA_OPTIONS: EmblaOptionsType = {align: 'start'};

export default function FeaturedCollection({module}: Props) {
  const fetcher = useFetcher();
  const {collection: collectionData} = (fetcher.data ?? {}) as {
    collection: Collection;
  };
  const {locale} = useContext(GlobalContext);
  const [product, setProduct] = useState<any>(null);
  const [variationsMap, setVariationsMap] = useState<any>(null);
  const [currentProductUrl, setCurrentProductUrl] = useState<any>(null);
  const [products, setProducts] = useState<any>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    moduleDescription,
    moduleHeading,
    collections,
    linkText,
    hideReviews,
    hideSwatches,
  } = module;
  const [emblaRef, emblaApi] = useEmblaCarousel(EMBLA_OPTIONS);

  const [selectedCollectionIndex, setSelectedCollectionIndex] = useState(0); // Track selected collection index
  const [fadeIn, setFadeIn] = useState(false); // State to trigger fade-in
  const [isFirstLoad, setIsFirstLoad] = useState(true); // State to track the initial page load

  const hasFetchedRef = useRef(false); // Ref to prevent duplicate fetch

  // Fetch products for the selected collection only if not already fetched
  useEffect(() => {
    if (collections && collections[selectedCollectionIndex]) {
      const selectedCollection =
        collections[selectedCollectionIndex].collection;

      // Check if the data is already fetched
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true; // Mark as fetched
        fetcher.load(
          `${locale.pathPrefix}/api${selectedCollection?.slug}?count=12`,
        );
      }
    }
  }, [fetcher, selectedCollectionIndex, locale.pathPrefix, collections]);

  useEffect(() => {
    // Set products if collection data is available
    if (collectionData?.products?.nodes) {
      setProducts(collectionData?.products?.nodes);
    }
  }, [collectionData?.products?.nodes]);

  // Effect to handle the first load visibility
  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false); // Mark first load as complete
      setFadeIn(true); // Ensure the first view is immediately visible
    }
  }, [isFirstLoad]);

  const closeModal = () => {
    setIsModalOpen(false);
    setProduct(null);
  };

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  if (
    !collections ||
    !collections[selectedCollectionIndex]?.collection ||
    !products
  )
    return null;

  const selectedCollection = collections[selectedCollectionIndex].collection;

  return (
    <div className="featured-collection page-width flex flex-col gap-[34px] md:min-h-[650px] md:flex-row md:overflow-hidden lg:pl-[2rem]">
      <div className="flex w-full flex-col items-center justify-start gap-4 pt-10 md:w-1/3 md:items-start lg:w-1/4">
        {moduleHeading && (
          <h2 className="text-center md:text-left">{moduleHeading}</h2>
        )}
        {moduleDescription && (
          <span className="text-center text-sm md:text-left">
            {moduleDescription}
          </span>
        )}
        <div className="w-full px-2">
          {/* Render sidebar titles */}
          <div className="flex flex-row justify-between gap-2 pt-4 md:flex-col ">
            {collections.map((item, index) => (
              <button
                key={index}
                className={`text-base cursor-pointer text-center font-gotham md:text-left${
                  index === selectedCollectionIndex
                    ? ' underline' // Underline and active style when selected
                    : ' hover:underline' // Underline on hover
                }`}
                onClick={() => {
                  setSelectedCollectionIndex(index);
                  setFadeIn(false); // Reset fade-in effect before starting the fade
                  setTimeout(() => setFadeIn(true), 10); // Trigger fade-in effect after click
                  hasFetchedRef.current = false; // Reset fetch flag when switching collection
                }}
              >
                {item.sidebarTitle}
              </button>
            ))}
          </div>
        </div>

        {selectedCollection?.slug && linkText && (
          <span>
            <Link
              to={selectedCollection?.slug}
              prefetch="intent"
              className="button-link-border-b"
            >
              {linkText}
            </Link>
          </span>
        )}
      </div>
      <div
        className={`-mx-5 flex w-full flex-col gap-[26px] md:w-2/3 md:overflow-hidden lg:w-3/4 ${
          fadeIn
            ? 'opacity-100 transition-opacity duration-1000 ease-in'
            : 'opacity-0'
        }`}
      >
        <div>
          <div className="md:overflow-hidden " ref={emblaRef}>
            <div
              className={`embla__container ml-5 flex w-full touch-pan-y flex-row flex-nowrap md:-ml-1 `}
            >
              {products &&
                products.map((product?) => (
                  <div
                    className={`relative min-w-0 flex-shrink-0 flex-grow-0 basis-1/2 pl-[7px] lg:basis-1/3 `}
                    key={product.id}
                  >
                    <FeaturedProductsCard
                      product={product}
                      setProduct={() => setProduct(product)}
                      currentProductUrl={currentProductUrl}
                      setCurrentProductUrl={setCurrentProductUrl}
                      setVariationsMap={setVariationsMap}
                      products={products}
                      setProducts={setProducts}
                      setIsModalOpen={setIsModalOpen}
                      hideReviews={hideReviews}
                      hideSwatches={hideSwatches}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
        {products?.length > 3 && (
          <div className="flex w-screen items-center justify-center gap-[10px] md:w-full">
            <PrevNextButtons
              onPrevButtonClick={onPrevButtonClick}
              onNextButtonClick={onNextButtonClick}
              prevBtnDisabled={prevBtnDisabled}
              nextBtnDisabled={nextBtnDisabled}
            />
          </div>
        )}
      </div>
      <div className="modal-container group">
        {product && isModalOpen === true && (
          <Modal isModalOpen={isModalOpen} closeModal={closeModal}>
            <ProductDetailsCard
              data={product}
              products={products}
              title={product?.title}
              variationsMap={variationsMap}
              currentProductUrl={currentProductUrl}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}
