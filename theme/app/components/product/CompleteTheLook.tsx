import {RecommendProduct} from '@xgenai/sdk-core';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  NextButton,
  PrevButton,
  usePrevNextButtons,
} from '~/components/modules/EmblaCarouselArrowButtons';
import ProductDetailsCard from '~/components/product/DetailsCardPLP';
import useTrackElementInteractions from '~/hooks/useTrackElementInteractions';
import {useColorTheme} from '~/lib/theme';
import {
  fetchShopifyPrices,
  GlobalContext,
  returnPriceData,
  returnShopifyIds,
} from '~/lib/utils';
import {XGenRecommendationResultItem} from '~/lib/xgen/types';
import {PodDataContext} from '~/routes/($lang).products.$handle';
import {AdjustedPriceData} from '~/types/shopify';

import Modal from '../global/ModalCard';
import YMALCard from './YMALCard';

export default function CompleteTheLook() {
  const colorTheme = useColorTheme();
  const {
    completeTheLookData,
    isLoading,
    error,
  }: {
    completeTheLookData: XGenRecommendationResultItem;
    isLoading: boolean;
    error: string | null;
  } = useContext(PodDataContext);
  const [activeProduct, setActiveProduct] = useState(null);
  const [products, setProducts] = useState(null);
  const [variationsMap, setVariationsMap] = useState(null);
  const [currentProductUrl, setCurrentProductUrl] = useState(null);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [priceData, setPriceData] = useState<AdjustedPriceData>({});
  const {locale} = useContext(GlobalContext);
  const [handleToFetch, setHandleToFetch] = useState<string | null>(null);

  const closeModal =
    (setIsModalOpen: Dispatch<SetStateAction<boolean>>) => () => {
      setIsModalOpen(false);
    };

  const boundCloseModal = closeModal(setIsModalOpen);

  const fetchProductInfo = async (handle: string, activeOrRelated: string) => {
    if (activeOrRelated === 'activeProduct') {
      const response = await fetch(`/api/catalog/products/${handle}`);
      const data: any = await response.json();
      data.product.isQuickView = true;
      const url: any = '/products/' + data.product.handle;
      const swatchTransform: any = {};

      data.product.colorSwatches.products.edges.map(function (el) {
        const node = el.node;
        const color = node.options[0].values[0];

        if (node.metafield) {
          const item = {
            swatch_image: node.metafield.reference.image.url,
            url: '/products/' + node.handle,
          };
          swatchTransform[color] = item;
        }
      });
      setShouldFetch(false);
      setActiveProduct(data.product);
      // setVariationsMap is populated w/ Shopify data
      setVariationsMap(swatchTransform);
      setCurrentProductUrl(url);
      setIsModalOpen(true);
      setProducts(data.product);
    }
  };

  useEffect(() => {
    if (handleToFetch && shouldFetch) {
      fetchProductInfo(handleToFetch, 'activeProduct');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleToFetch]);

  const shopifyIds = returnShopifyIds(
    completeTheLookData?.normalizedItems ?? [],
  );
  const validShopifyIds = shopifyIds?.filter(
    (id) => id !== undefined,
  ) as number[];
  // Localized product prices
  const fetchPrices = useCallback(async () => {
    const fetchedData = await fetchShopifyPrices(validShopifyIds, locale);
    if (fetchedData) {
      setPriceData(fetchedData);
    }
  }, [validShopifyIds, locale]);
  const fetchedPriceRefs = useRef(false);
  useEffect(() => {
    const shouldFetchPrices =
      shopifyIds?.length > 0 && !fetchedPriceRefs.current;
    if (shouldFetchPrices) {
      fetchPrices();
      fetchedPriceRefs.current = true; // Set the ref after fetching
    }
  }, [fetchPrices, shopifyIds]);

  // Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    slidesToScroll: 3,
    skipSnaps: true,
    duration: 1000,
  });

  const [currentSlide, setCurrentSlide] = useState<number>(0);

  useEffect(() => {
    if (!emblaApi) return;

    const updateCurrentSlide = () => {
      setCurrentSlide(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('settle', updateCurrentSlide);
    return () => {
      if (!emblaApi) {
        return;
      }
      emblaApi.off('settle', updateCurrentSlide);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev(true);
  }, [emblaApi]);
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext(true);
  }, [emblaApi]);
  const {prevBtnDisabled, nextBtnDisabled} = usePrevNextButtons(emblaApi);

  const {ref} = useTrackElementInteractions({
    elementId: completeTheLookData?.id!,
    items: completeTheLookData?.items?.map((item) => item.prod_code),
    resetKey: completeTheLookData?.items
      ?.map((item) => item.prod_code)
      .join(','),
    externalRef: emblaRef,
    enabled: completeTheLookData?.id!.length > 0,
    threshold: 0,
  });

  if (!completeTheLookData || completeTheLookData?.items?.length === 0) {
    return null;
  }
  if (isLoading) {
    return null;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <div
        className={clsx(
          'relative border-b border-gray pt-4', //
        )}
        style={{background: colorTheme?.background || 'white'}}
        id="ctl-cards"
      >
        <div
          className={clsx('pb-4 text-xs font-bold uppercase tracking-[1px]')}
        >
          Wear It With
        </div>
        <div className={clsx('overflow-hidden')} ref={ref}>
          <div className="embla__container ctl-slider flex flex-row items-start justify-start gap-2 pb-2">
            {completeTheLookData.items?.map(
              (item: RecommendProduct, index: number) => {
                return (
                  <div
                    className="slide w-1/2 basis-1/2 pl-2 lg:w-1/3 lg:basis-1/3"
                    key={item.prod_code}
                  >
                    <YMALCard
                      data={item}
                      variations={item.variations}
                      title={item.prod_name}
                      loading={index < 8 ? 'eager' : 'lazy'}
                      priceData={returnPriceData(
                        Number(item.prod_code),
                        priceData,
                      )}
                      setHandleToFetch={setHandleToFetch}
                      setShouldFetch={setShouldFetch}
                      isCompleteTheLook={true}
                    />
                  </div>
                );
              },
            )}
          </div>
        </div>
        {/* Arrows for slide navigation */}
        {completeTheLookData.items.length > 3 && (
          <div className="relative bottom-[0px] left-1/2 mb-2 flex -translate-x-1/2 transform justify-center gap-2">
            <PrevButton
              className="pointer-events-auto flex h-[40px] w-[30px] cursor-pointer items-center justify-center bg-[#F2F3F5] disabled:opacity-[.3]"
              onClick={scrollPrev}
              disabled={prevBtnDisabled}
            />

            <NextButton
              className="pointer-events-auto flex h-[40px] w-[30px] cursor-pointer items-center justify-center bg-[#F2F3F5] disabled:opacity-[.3]"
              onClick={scrollNext}
              disabled={nextBtnDisabled}
            />
          </div>
        )}
      </div>
      {isModalOpen === true && activeProduct && (
        <Modal isModalOpen={isModalOpen} closeModal={boundCloseModal}>
          {
            <ProductDetailsCard
              data={activeProduct}
              products={[products]}
              setProducts={setProducts}
              title={activeProduct.title}
              variationsMap={variationsMap}
              currentProductUrl={currentProductUrl}
              shouldFetch={shouldFetch}
              setShouldFetch={setShouldFetch}
              isPDPYMALCard={true}
            />
          }
        </Modal>
      )}
    </>
  );
}
