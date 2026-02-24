import {RecommendProduct} from '@xgenai/sdk-core';
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
import {v4 as uuidv4} from 'uuid';

import Modal from '~/components/global/ModalCard';
import {usePrevNextButtons} from '~/components/modules/EmblaCarouselArrowButtons';
import {
  NextButton,
  PrevButton,
} from '~/components/modules/EmblaCarouselArrowButtons';
import ProductDetailsCard from '~/components/product/DetailsCardPLP';
import YMALCard from '~/components/product/YMALCard';
import {useHydration} from '~/hooks/useHydration';
import {fetchShopifyPrices, GlobalContext, returnPriceData} from '~/lib/utils';
import {type XGenRecommendationResultProps} from '~/lib/xgen/types';
import {PodDataContext} from '~/routes/($lang).products.$handle';
import {AdjustedPriceData} from '~/types/shopify';

import {BUTTON_CLASSNAMES} from '../product/buttons/PrevNextButtons';
import RecommendationsResultsSliderSSR from './RecommendationsResultsSliderSSR';

function RecommendationsResultsSliderCSR(props: XGenRecommendationResultProps) {
  const {items, displayOptions} = props;
  // localized product prices
  const [priceData, setPriceData] = useState<AdjustedPriceData>({});
  const shopifyIds = items.map((item) => item.prod_code);
  const {locale} = useContext(GlobalContext);
  const [activeProduct, setActiveProduct] = useState(null);
  const [handleToFetch, setHandleToFetch] = useState<string | null>(null);
  const [products, setProducts] = useState(null);
  const [variationsMap, setVariationsMap] = useState(null);
  const [currentProductUrl, setCurrentProductUrl] = useState(null);
  const [shouldFetch, setShouldFetch] = useState(false);
  // end localized product prices
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal =
    (setIsModalOpen: Dispatch<SetStateAction<boolean>>) => () => {
      setIsModalOpen(false);
    };
  const boundCloseModal = closeModal(setIsModalOpen);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    slidesToScroll: 1,
    skipSnaps: true,
    duration: 1000,
  });
  const {prevBtnDisabled, nextBtnDisabled} = usePrevNextButtons(emblaApi);

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev(true);
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext(true);
    }
  }, [emblaApi]);

  // Localized product prices
  const validShopifyIds = shopifyIds.map(Number).filter(Boolean);
  const fetchPrices = useCallback(async () => {
    const fetchedData = await fetchShopifyPrices(validShopifyIds, locale);
    if (fetchedData) {
      setPriceData(fetchedData);
    }
  }, [validShopifyIds, locale]);

  const fetchedRef = useRef(false);

  useEffect(() => {
    fetchedRef.current = false;
  }, [items]);

  useEffect(() => {
    const shouldFetch = shopifyIds.length > 0 && !fetchedRef.current;
    if (shouldFetch) {
      fetchPrices();
      fetchedRef.current = true; // Set the ref after fetching
    }
  }, [fetchPrices, shopifyIds]);
  // end localized product prices

  const cioFamilyTag = useContext(PodDataContext)?.cioFamilyTag ?? '';
  const fetchProductInfo = async (handle: any, activeOrRelated: string) => {
    if (activeOrRelated === 'activeProduct') {
      const response = await fetch(`/api/catalog/products/${handle}`);
      const data: any = await response.json();
      data.product.isQuickView = true;
      const url: any = '/products/' + data.product.handle;

      const swatchTransform: any = {};

      if (data.product.colorSwatches) {
        data.product.colorSwatches.products.edges.map(function (el: {
          node: any;
        }) {
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
      }

      setShouldFetch(false);
      setActiveProduct(data.product);
      // variationsMap is actually Shopify data
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
  }, [handleToFetch, shouldFetch]);

  // if (!items || items.length === 0) {
  //   return <></>; // Render nothing when there are no items
  // }

  const uniqueId = uuidv4();
  const buttonPosition = cioFamilyTag ? '24' : '0';
  const dynamicStyles = `
  ${
    displayOptions?.cardsVisible === 'more'
      ? `@media (min-width: 550px) {
    #recommendations.recommendations-ui-${uniqueId} .slide {
    flex: 0 0 33%;
    min-width: unset;
  }
  @media (min-width: 768px) {
    #recommendations.recommendations-ui-${uniqueId} .slide {
    flex: 0 0 20%;
  }
  @media (min-width: 1024px) {
    #recommendations.recommendations-ui-${uniqueId} .slide {
    flex: 0 0 15.25%;
  }
  }`
      : ''
  }
  @media (min-width: 768px) {
    .left-button-position {
      left: ${buttonPosition}px;
    }
    .right-button-position {
      right: ${buttonPosition}px;
    }
  }`;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: dynamicStyles}} />
      <div
        id="recommendations"
        className={`recommendations-carousel recommendations-ui-${uniqueId} mx-0 pt-[30px] ${
          cioFamilyTag ? ' md:mx-20' : ''
        } min-h-[375px] md:pt-10`}
        ref={emblaRef}
      >
        <div
          className={`embla__container flex flex-row items-start justify-${
            items.length > 5 ? 'start' : 'center'
          }`}
        >
          {items.map((item: RecommendProduct, index: number) => {
            return (
              <div
                className="slide min-h-[375px] basis-1/2 pl-[7px] lg:basis-1/5"
                key={item.prod_code}
                data-item={item.prod_code}
              >
                <YMALCard
                  key={`${item.id}${item.prod_code}`}
                  data={item} // RecommendProduct type
                  title={item.prod_name}
                  loading={index < 8 ? 'eager' : 'lazy'}
                  priceData={returnPriceData(Number(item.prod_code), priceData)}
                  setHandleToFetch={setHandleToFetch}
                  setShouldFetch={setShouldFetch}
                  showColorSwatches={displayOptions?.showColorSwatches}
                />
              </div>
            );
          })}
        </div>
      </div>
      {items?.length > 3 && (
        <div className="relative left-0 top-1/2 flex w-full -translate-y-1/2 transform items-center justify-center gap-[10px] md:absolute md:w-full">
          <PrevButton
            className={`left-button-position relative md:absolute ${BUTTON_CLASSNAMES}`}
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
          />

          <NextButton
            className={`right-button-position relative md:absolute ${BUTTON_CLASSNAMES}`}
            onClick={scrollNext}
            disabled={nextBtnDisabled}
          />
        </div>
      )}
      {isModalOpen === true && activeProduct && (
        <Modal isModalOpen={isModalOpen} closeModal={boundCloseModal}>
          {
            <ProductDetailsCard
              data={activeProduct}
              products={[products]}
              setProducts={setProducts}
              title={activeProduct.title}
              // variations is actually Shopify data
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

export function RecommendationsResultsSlider(props: any) {
  const isHydrated = useHydration();
  return (
    <>
      {isHydrated ? (
        <RecommendationsResultsSliderCSR {...props} />
      ) : (
        <RecommendationsResultsSliderSSR {...props} />
      )}
    </>
  );
}
