import {useFetcher} from '@remix-run/react';
import {Collection} from '@shopify/hydrogen/storefront-api-types';
import {EmblaOptionsType} from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import {useContext, useEffect, useState} from 'react';

import Modal from '~/components/global/ModalCard';
import ProductDetailsCard from '~/components/product/DetailsCardFeaturedCollection';
import {FeaturedCollection as FeaturedCollectionType} from '~/lib/sanity';
import {GlobalContext} from '~/lib/utils';

import PrevNextButtons from '../product/buttons/PrevNextButtons';
import FeaturedProductsCard from '../product/CardFeaturedProducts';
import {usePrevNextButtons} from './EmblaCarouselArrowButtons';

type Props = {
  module: FeaturedCollectionType;
};

const EMBLA_OPTIONS: EmblaOptionsType = {align: 'start'};

export default function PromoProducts({module}: Props) {
  const fetcher = useFetcher();
  const {collection: collectionData} = (fetcher.data ?? {}) as {
    collection: Collection;
  };
  const {locale} = useContext(GlobalContext);
  const [product, setProduct] = useState<any>(null);
  // variationsMap will be populated w/ Shopify data, in FeaturedProductsCard
  const [variationsMap, setVariationsMap] = useState<any>(null);
  const [currentProductUrl, setCurrentProductUrl] = useState<any>(null);
  const [products, setProducts] = useState<any>([]);

  const {collection} = module;
  const [emblaRef, emblaApi] = useEmblaCarousel(EMBLA_OPTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setProducts(collectionData?.products?.nodes);
  }, [collectionData?.products?.nodes]);

  useEffect(() => {
    if (fetcher.data || fetcher.state == 'loading') return;
    fetcher.load(`${locale.pathPrefix}/api${collection?.slug}?count=12`);
  }, [fetcher, collection?.slug, locale.pathPrefix]);

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
  if (!collection || !products) return null;
  return (
    <div className="featured-collection page-width flex flex-col gap-[34px] md:flex-row md:overflow-hidden">
      <div className="-mx-5 flex w-full flex-col gap-[26px] md:w-2/3 md:overflow-hidden lg:w-full">
        <div>
          <div className="md:overflow-hidden" ref={emblaRef}>
            <div className="embla__container ml-5 flex w-full touch-pan-y flex-row flex-nowrap md:-ml-1">
              {products &&
                products.map((product?) => (
                  // Product cards
                  <div
                    className="relative min-w-0 flex-shrink-0 flex-grow-0 basis-1/2 pl-[7px] lg:basis-1/6"
                    key={product.id}
                  >
                    <FeaturedProductsCard
                      product={product}
                      setProduct={() => setProduct(product)}
                      currentProductUrl={currentProductUrl}
                      setCurrentProductUrl={setCurrentProductUrl}
                      // setVariationsMap will be populated w/ Shopify data
                      setVariationsMap={setVariationsMap}
                      products={products}
                      setProducts={setProducts}
                      setIsModalOpen={setIsModalOpen}
                    />
                  </div>
                ))}{' '}
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
            {
              <ProductDetailsCard
                data={product}
                products={products}
                title={product?.title}
                // variationsMap is populated w/ Shopify data
                variationsMap={variationsMap}
                currentProductUrl={currentProductUrl}
              />
            }
          </Modal>
        )}
      </div>
    </div>
  );
}
