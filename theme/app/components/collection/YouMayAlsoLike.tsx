import type {Product} from '@shopify/hydrogen/storefront-api-types';
import {
  RecommendGetResultsByIdReturn,
  RecommendProduct,
} from '@xgenai/sdk-core';
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
import {useXgenClient} from '~/contexts/XgenClientContext';
import useTrackElementInteractions from '~/hooks/useTrackElementInteractions';
import {useColorTheme} from '~/lib/theme';
import {fetchShopifyPrices, GlobalContext, returnPriceData} from '~/lib/utils';
import {getPodBySanityId} from '~/lib/xgen/utils/getPodById';
import {AdjustedPriceData} from '~/types/shopify';

import PrevNextButtons from '../product/buttons/PrevNextButtons';
import YMALCard from '../product/YMALCard';

type Props = {
  product?: Product;
  recommendationsData?: RecommendGetResultsByIdReturn;
  categoryId?: string;
};

export default function YouMayAlsoLike({
  recommendationsData,
  categoryId,
}: Props) {
  const xgenClient = useXgenClient();
  const colorTheme = useColorTheme();
  const [currentRecommendations, setCurrentRecommendations] =
    useState<RecommendGetResultsByIdReturn | null>(
      () => recommendationsData ?? null,
    );

  useEffect(() => {
    async function fetchData() {
      if (!xgenClient) return;
      const response = await xgenClient.recommend.getResultsById({
        elementId: getPodBySanityId('product-listing-pages').id,
        options: {
          context: {
            filterCategory: categoryId,
          },
        },
      });
      setCurrentRecommendations(response);
    }
    if (!recommendationsData) {
      fetchData();
    }
  }, [xgenClient, recommendationsData]);

  const elementId = getPodBySanityId('product-listing-pages').id;
  const itemsCodes =
    currentRecommendations?.items?.map((item) => item.prod_code) || [];

  const {ref} = useTrackElementInteractions({
    elementId,
    items: itemsCodes,
    threshold: 0,
    click: {
      once: false,
      extract: {selector: '[data-item]', attr: 'data-item'},
    },
  });

  return (
    <div
      className="pb-20 pt-[40px]"
      style={{background: colorTheme?.background || 'white'}}
    >
      {!!currentRecommendations?.items?.length && (
        <div ref={ref}>
          <h2 className={clsx('font-normal text-base font-primary block px-5')}>
            {currentRecommendations?.title ?? 'Recently Viewed'}
          </h2>
          <RecommendationsResults items={currentRecommendations?.items || []} />
        </div>
      )}
    </div>
  );
}

function RecommendationsResults(props: {items: RecommendProduct[]}) {
  const {items} = props;
  const [activeProduct, setActiveProduct] = useState(null);
  const [handleToFetch, setHandleToFetch] = useState<string | null>(null);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [variationsMap, setVariationsMap] = useState(null);
  const [currentProductUrl, setCurrentProductUrl] = useState(null);
  const [products, setProducts] = useState(null);
  // localized product prices
  const [priceData, setPriceData] = useState<AdjustedPriceData>({});
  const shopifyIds = items.map((item) => item.prod_code);
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
  const validShopifyIds = shopifyIds.filter((id) => id !== undefined);
  const fetchPrices = useCallback(async () => {
    const fetchedData = await fetchShopifyPrices(
      validShopifyIds.map(Number),
      locale,
    );
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
    if (handleToFetch && shouldFetch) {
      fetchProductInfo(handleToFetch, 'activeProduct');
    }
  }, [handleToFetch, shouldFetch]);

  if (!items || items.length === 0) {
    return <></>; // Render nothing when there are no items
  }

  return (
    <div
      id="recommendations"
      className="recommendations-carousel relative pt-[30px] md:pt-10"
      data-cnstrc-recommendations
      ref={emblaRef}
    >
      <div
        className={`embla__container flex flex-row items-start justify-${
          items.length > 5 ? 'start' : 'center'
        } gap-[10px] md:ml-[35px] md:mr-[45px] md:gap-[44px]`}
      >
        {items.map((item: RecommendProduct, index: number) => (
          <div
            className="slide basis-1/2 pl-[7px] lg:basis-1/5"
            key={item.prod_code}
            data-cnstrc-item="Recommendation"
            data-item={item.prod_code}
          >
            <YMALCard
              key={`${item.prod_code}`}
              title={item.prod_name}
              data={item}
              loading={index < 8 ? 'eager' : 'lazy'}
              priceData={returnPriceData(Number(item.prod_code), priceData)}
              swatches={undefined}
              setHandleToFetch={setHandleToFetch}
              setShouldFetch={setShouldFetch}
            />
          </div>
        ))}
      </div>
      {items?.length > 3 && (
        <div className="ymal-arrows flex w-screen items-center justify-center gap-[10px] md:w-full">
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
              //variations is actually Shopify data
              vairationsMap={variationsMap}
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
