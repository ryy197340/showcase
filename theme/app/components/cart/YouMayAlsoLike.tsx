import type {Product} from '@shopify/hydrogen/storefront-api-types';
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

import Modal from '~/components/global/ModalCard';
import {usePrevNextButtons} from '~/components/modules/EmblaCarouselArrowButtons';
import ProductDetailsCard from '~/components/product/DetailsCardPLP';
import useTrackElementInteractions from '~/hooks/useTrackElementInteractions';
import {
  CioBsRecommendationResultProps,
  CioBsResult,
} from '~/lib/constructor/types';
import {useColorTheme} from '~/lib/theme';
import {fetchShopifyPrices, GlobalContext, returnPriceData} from '~/lib/utils';
import {AdjustedPriceData} from '~/types/shopify';

import PrevNextButtons from '../product/buttons/PrevNextButtons';
import YMALCard from '../product/YMALCard';

type Props = {
  recommendationsData?: Product[];
};

export default function BestSellers({recommendationsData}: Props) {
  const colorTheme = useColorTheme();
  // tracking handled inside useTrackElementInteractions

  const [podId, setPodId] = useState('cart-page');

  const currentRecommendations = recommendationsData?.find(
    (item) => item.response.pod.id === podId,
  );

  const elementId = podId;
  const itemsCodes =
    currentRecommendations?.response.results?.map(
      (item) => item.data.shopify_id?.toString() || '',
    ) || [];

  const {ref} = useTrackElementInteractions({
    elementId,
    items: itemsCodes,
    threshold: 0,
    click: {
      // use repeated clicks; extract item from [data-item]
      once: false,
      extract: {selector: '[data-item]', attr: 'data-item'},
    },
  });

  return (
    <div
      className={clsx('clear-both py-2 md:py-1.5')}
      style={{background: colorTheme?.background || 'white'}}
    >
      {recommendationsData && (
        <div ref={ref}>
          <h2
            className={clsx(
              'font-normal text-base font-primary mb-4 block text-center',
            )}
          >
            You May Also Like
          </h2>
          <RecommendationsResults
            items={currentRecommendations?.response.results || []}
            dataAttributes={{
              dataCnstrcPodId: currentRecommendations?.response?.pod?.id || '',
              dataCnstrcNumResults:
                currentRecommendations?.response?.total_num_results || 0,
              dataCnstrcResultId: currentRecommendations?.result_id || '',
            }}
          />
        </div>
      )}
    </div>
  );
}

function RecommendationsResults(props: CioBsRecommendationResultProps) {
  const {items, dataAttributes} = props;
  const [activeProduct, setActiveProduct] = useState(null);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [variationsMap, setVariationsMap] = useState(null);
  const [currentProductUrl, setCurrentProductUrl] = useState(null);
  const [products, setProducts] = useState(null);
  // localized product prices
  const [priceData, setPriceData] = useState<AdjustedPriceData>({});
  const shopifyIds = items.map((item) => item.data.shopify_id);
  const {locale} = useContext(GlobalContext);
  // localized product prices

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
  const validShopifyIds = shopifyIds.filter(
    (id) => id !== undefined,
  ) as number[];
  const fetchPrices = useCallback(async () => {
    const fetchedData = await fetchShopifyPrices(validShopifyIds, locale);
    if (fetchedData) {
      setPriceData(fetchedData);
    }
  }, [validShopifyIds, locale]);

  const fetchedRef = useRef(false);

  const fetchProductInfo = async (handle: any, activeOrRelated: string) => {
    if (activeOrRelated === 'activeProduct') {
      const response = await fetch(`/api/catalog/products/${handle}`);
      const data: any = await response.json();
      data.product.isQuickView = true;
      const url: any = '/products/' + data.product.handle;

      const swatchTransform: any = {};

      if (data.product.colorSwatches) {
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
    const shouldFetch = shopifyIds.length > 0 && !fetchedRef.current;
    if (shouldFetch) {
      fetchPrices();
      fetchedRef.current = true; // Set the ref after fetching
    }
  }, [fetchPrices, shopifyIds]);
  // end localized product prices

  useEffect(() => {
    if (activeProduct && shouldFetch) {
      fetchProductInfo(
        activeProduct.url.replace('/products/', ''),
        'activeProduct',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProduct]);

  if (!items || items.length === 0) {
    return <></>; // Render nothing when there are no items
  }

  return (
    <div
      id="recommendations"
      className="recommendations-carousel page-width pt-[30px] md:pt-10"
      data-cnstrc-recommendations
      data-cnstrc-recommendations-pod-id={dataAttributes.dataCnstrcPodId}
      data-cnstrc-num-results={dataAttributes.dataCnstrcNumResults}
      data-cnstrc-result-id={dataAttributes.dataCnstrcResultId}
      ref={emblaRef}
    >
      <div
        className={`embla__container flex flex-row items-start justify-${
          items.length > 5 ? 'start' : 'center'
        } gap-[10px] md:gap-[44px]`}
      >
        {items.map((item: CioBsResult, index: number) => (
          <div
            className="slide basis-1/2 pl-[7px] lg:basis-1/5"
            key={item.data.id}
            data-cnstrc-item="Recommendation"
            data-cnstrc-item-id={item.data.id}
            data-cnstrc-item-name={item.value}
            data-cnstrc-item-variation-id={item.data.variation_id}
            data-cnstrc-strategy-id={item.strategy.id}
            data-item={item.data.shopify_id?.toString() || ''}
          >
            <YMALCard
              key={`${item.data.id}${item.data.shopify_id}`}
              title={item.value}
              data={item.data}
              loading={index < 8 ? 'eager' : 'lazy'}
              priceData={returnPriceData(item.data.shopify_id, priceData)}
              swatches={undefined}
              setActiveProduct={setActiveProduct}
              setShouldFetch={setShouldFetch}
            />
          </div>
        ))}
      </div>
      {items?.length > 3 && (
        <div className="flex w-screen items-center justify-center md:w-full md:gap-[10px]">
          <PrevNextButtons
            onPrevButtonClick={scrollPrev}
            onNextButtonClick={scrollNext}
            prevBtnDisabled={prevBtnDisabled}
            nextBtnDisabled={nextBtnDisabled}
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
    </div>
  );
}
