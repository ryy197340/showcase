import {Image} from '@shopify/hydrogen';
import {RecommendProduct} from '@xgenai/sdk-core/dist/types/recommend';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import {useCallback, useEffect, useState} from 'react';

import {Link} from '~/components/Link';
import {
  NextButton,
  PrevButton,
  usePrevNextButtons,
} from '~/components/modules/EmblaCarouselArrowButtons';
import {CioVariation} from '~/lib/constructor/types';
import {ColorSwatches} from '~/lib/shopify/types';
import AddToWishlistButton from '~/lib/swym/components/wishlist/AddToWishlistButton';
import getProductHandle from '~/lib/xgen/utils/getProductHandle';
import {normalizeProductLink} from '~/lib/xgen/utils/normalizeProductLink';
import {stripGlobalId} from '~/utils';

import Currency from '../global/Currency';
import CurrencyRange from '../global/CurrencyRange';
import QuickviewPlus from '../icons/QuickviewPlus';

type Props = {
  title: string;
  data: RecommendProduct;
  swatches: any;
  loading: 'eager' | 'lazy';
  priceData?: any;
  setHandleToFetch: (handle: string) => void;
  setShouldFetch: (shouldFetch: boolean) => void;
  isCompleteTheLook?: boolean;
  showColorSwatches?: boolean;
};

export default function YMALCard({
  title,
  data,
  swatches,
  loading,
  priceData,
  setHandleToFetch,
  setShouldFetch,
  isCompleteTheLook,
  showColorSwatches,
}: Props) {
  const [currentImgUrl, setCurrentImgUrl] = useState(data.image);
  const [currentProductUrl, setCurrentProductUrl] = useState(() => {
    return normalizeProductLink(data.link);
  });
  const [currentPrice, setCurrentPrice] = useState(data.price);

  const [isNewProductTag, setIsNewProductTag] = useState(false);
  const [bestsellerTag, setBestsellerTag] = useState(false);

  const [colorSwatches, setColorSwatches] = useState<
    ColorSwatches | Record<string, never>
  >({});

  useEffect(() => {
    const activationDateString = data?.activation_date;
    if (activationDateString) {
      const activationDate = new Date(activationDateString);
      const currentDate = new Date();

      if (!isNaN(activationDate.getTime())) {
        const daysDifference =
          (currentDate.getTime() - activationDate.getTime()) /
          (1000 * 60 * 60 * 24);

        const isWithinLast30Days = daysDifference <= 30;
        setIsNewProductTag(isWithinLast30Days);
      }
    }

    if (data?.bestseller) {
      setBestsellerTag(data.bestseller);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // for localized price
  const price = priceData?.priceRange?.minVariantPrice;
  const compareAtPrice =
    priceData?.compareAtPriceRange?.maxVariantPrice &&
    priceData?.compareAtPriceRange?.maxVariantPrice.amount !== '0.0'
      ? priceData?.compareAtPriceRange?.maxVariantPrice
      : null;
  const slidesToScroll = 4;
  const enableScroll =
    swatches && swatches.products.edges.length > slidesToScroll;

  // Embla carousel functions
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true, // slidesToScroll prevented poiting the accurate swatch on page load, so we disabled it
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev(true);
  }, [emblaApi]);
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext(true);
  }, [emblaApi]);
  const {prevBtnDisabled, nextBtnDisabled} = usePrevNextButtons(emblaApi);

  // TODO set defaultSwatch
  // const defaultSwatch: string | undefined =
  //   colorSwatches && colorSwatches?.colorSwatches
  //     ? colorSwatches?.colorSwatches?.products?.edges[0].node?.id
  //     : undefined;
  const defaultSwatch: string | undefined = undefined;

  const [selectedSwatch, setSelectedSwatch] = useState<string | undefined>(
    defaultSwatch,
  );
  const [currentPreorderMessage, setCurrentPreorderMessage] = useState<
    string | undefined
  >();

  const updateSwatch = (swatch: CioVariation) => {
    setCurrentImgUrl(swatch?.node?.featuredImage?.url ?? '');
    setCurrentProductUrl(`/products/${swatch?.node?.handle}` ?? '');
    setCurrentPrice(swatch?.node?.priceRange?.minVariantPrice?.amount);
    setSelectedSwatch(swatch?.node?.id);
    setCurrentPreorderMessage(swatch?.node?.preorder_message?.value);
  };

  useEffect(() => {
    (async () => {
      const getColorSwatches = async (
        family: string | undefined,
      ): Promise<ColorSwatches | Record<string, never>> => {
        if (!family) {
          return {};
        }

        const req = await fetch(
          `/api/colorSwatchesFromShopify?family="${family}"`,
        );
        const res: ColorSwatches = await req.json();
        return res;
      };
      const swatchData = await getColorSwatches(data?.types?.[0]);
      setColorSwatches(swatchData);

      const initialSwatch = swatchData?.colorSwatches?.products?.edges?.find(
        (swatch) => stripGlobalId(swatch.node.id) == data.prod_code,
      );
      if (initialSwatch) {
        updateSwatch(initialSwatch);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alignClass = isCompleteTheLook ? 'start' : 'center';
  const textAlignClass = isCompleteTheLook ? 'left' : 'center';

  return (
    <div className="group">
      <div className="relative">
        <div className="absolute bottom-0 z-10 block w-full">
          <button
            onClick={() => {
              const handle = currentProductUrl.replace('/products/', '');
              setHandleToFetch(handle);
              setShouldFetch(true);
            }}
            className="pb-[5px] pl-[3px]"
            aria-label="Quick view"
          >
            <QuickviewPlus
              {...(isCompleteTheLook ? {width: 18, height: 18} : {})}
            />
          </button>
        </div>
        {currentImgUrl && (
          <Link to={currentProductUrl} prefetch="intent">
            <Image
              className=" h-full w-full transform bg-cover bg-center object-cover object-center ease-in-out"
              crop="center"
              sizes="100%"
              aspectRatio="170/227"
              src={currentImgUrl}
              width={350}
              height={500}
              loading={loading}
            />
          </Link>
        )}

        <div className="pointer-events-auto right-0 top-0 z-30">
          <AddToWishlistButton
            product={data}
            buttonSource={isCompleteTheLook ? 'pdp' : 'recos'}
            iconHeight={12.75}
            iconWidth={12}
          />
        </div>
      </div>

      <div
        className={`${
          isCompleteTheLook ? '' : 'mt-[10px]'
        } relative z-20 pb-5 text-center text-md`}
      >
        {/* Pre-order */}
        {!isCompleteTheLook && currentPreorderMessage && (
          <div className="flex justify-center gap-[5px] text-[11px] font-bold uppercase text-preorderMessage">
            {currentPreorderMessage}
          </div>
        )}
        <div
          className={`flex flex-col items-${alignClass} gap-y-[5px] space-y-1 text-${textAlignClass}`}
        >
          {/* Badging */}
          {!isCompleteTheLook && (
            <div className="badge flex gap-[5px]">
              {isNewProductTag && (
                <div className="absolute left-[10px] top-0 mb-[8px] mt-2 flex justify-center gap-[5px] bg-[#FFFFFF80] p-2 text-[10px] text-black">
                  New
                </div>
              )}
              {bestsellerTag && (
                <div className="inline-block bg-badge p-[8px] text-2xs">
                  Bestseller
                </div>
              )}
            </div>
          )}
          {/* Title */}
          <Link to={currentProductUrl} prefetch="intent">
            <span
              className={`${isCompleteTheLook ? 'text-[12px]' : 'text-[14px]'}`}
            >
              {title}
            </span>
          </Link>

          {/* Price */}
          <div
            className={`mt-3 flex justify-${alignClass} text-[11px] ${
              compareAtPrice ? 'sale' : ''
            }`}
          >
            {compareAtPrice && (
              <span className="saleGray mr-2 text-saleGray">
                <s style={{textDecorationThickness: 1}}>
                  <Currency data={compareAtPrice} />
                </s>
              </span>
            )}
            {price ? (
              title === 'Digital Gift Card' ? (
                <CurrencyRange priceRange={priceData.priceRange} />
              ) : (
                <Currency data={price} />
              )
            ) : currentPrice ? (
              <span>${Number.parseFloat(currentPrice).toFixed(2)}</span>
            ) : null}
          </div>

          {(showColorSwatches == undefined || showColorSwatches == true) &&
            !isCompleteTheLook &&
            colorSwatches &&
            colorSwatches?.colorSwatches?.products?.edges?.length > 0 && (
              <div
                className={`color-swatches mt-3 flex justify-${alignClass} space-x-2`}
              >
                {enableScroll && (
                  <PrevButton
                    className="disabled:opacity-[.3]"
                    onClick={scrollPrev}
                    disabled={prevBtnDisabled}
                  />
                )}
                <div
                  className={clsx({
                    'mx-1': true,
                    'overflow-hidden': true,
                    'p-[1px]': true,
                    embla: enableScroll,
                  })}
                  ref={emblaRef}
                  style={{width: `${slidesToScroll * 36}px`}}
                >
                  <div
                    className={clsx({
                      'flex duration-300': true,
                      embla__container: enableScroll,
                      'justify-center':
                        colorSwatches?.colorSwatches?.products?.edges?.length <=
                        slidesToScroll,
                    })}
                  >
                    {colorSwatches?.colorSwatches?.products?.edges.map(
                      (swatch: any, index: number) =>
                        swatch?.node?.metafield?.reference?.image?.url &&
                        !swatch.node.options[0].values.includes('No Color') && (
                          <button
                            className="p-[4px]"
                            key={swatch.node.id}
                            onClick={() => updateSwatch(swatch)}
                            data-option={swatch?.node?.id}
                          >
                            <div
                              className={clsx({
                                'ring-2 ring-primary ring-offset-2':
                                  selectedSwatch === swatch?.node?.id,
                                'block h-[16px] w-[16px] rounded-full': true,
                                embla__slide:
                                  colorSwatches?.colorSwatches?.products?.edges
                                    ?.length > slidesToScroll,
                                'ring-1 ring-neutral-100 ring-offset-0':
                                  !swatch.node.swatch_image &&
                                  selectedSwatch !== swatch?.node?.id,
                              })}
                              aria-label={swatch?.node?.id}
                              style={{
                                backgroundImage: `url(${swatch?.node?.metafield?.reference?.image?.url})`,
                              }}
                            />
                          </button>
                        ),
                    )}
                  </div>
                </div>
                {enableScroll && (
                  <NextButton
                    className="disabled:opacity-[.3]"
                    onClick={scrollNext}
                    disabled={nextBtnDisabled}
                  />
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
