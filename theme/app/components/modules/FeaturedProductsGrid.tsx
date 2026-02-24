import {Image} from '@shopify/hydrogen';
import Tippy from '@tippyjs/react/headless';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import {useCallback, useEffect, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

import Tooltip from '~/components/elements/Tooltip';
import {
  NextButton,
  PrevButton,
  usePrevNextButtons,
} from '~/components/modules/EmblaCarouselArrowButtons';
import {FeaturedProductsGrid as FeaturedProductsGridType} from '~/lib/sanity';

import {Link} from '../Link';
type Props = {
  module: FeaturedProductsGridType;
  isHomepageModule: boolean;
};

const MAX_SWATCHES_DISPLAYED = 4;

export default function FeaturedProductsGrid({
  module,
  isHomepageModule,
}: Props) {
  const {products, title, sidebar} = module;
  const [showAllSwatchesMap, setShowAllSwatchesMap] = useState<{
    [key: string]: boolean;
  }>({});
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: isHomepageModule ? false : true,
    slidesToScroll: 1,
    align: 'start',
  });

  usePrevNextButtons(emblaApi);
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev(true);
  }, [emblaApi]);
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext(true);
  }, [emblaApi]);
  const {prevBtnDisabled, nextBtnDisabled} = usePrevNextButtons(emblaApi);

  const toggleSwatchVisibility = (productId: string) => {
    setShowAllSwatchesMap((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const activationDate = (activation_date: string) => {
    const activationDate = new Date(activation_date);
    const currentDate = new Date();

    const daysDifference =
      (currentDate - activationDate) / (1000 * 60 * 60 * 24);

    const isWithinLast30Days = daysDifference <= 30;
    return isWithinLast30Days;
  };

  useEffect(() => {
    const fetchProductData = async () => {
      if (products && products.length === 0) return;
      if (products && products.length > 0) {
        try {
          const updatedProducts = await Promise.all(
            products.map(async (product) => {
              const handle = product[0].store.slug.current;
              const productInfo = fetchProductInfo(handle);
              const result = await productInfo;
              product[0].store.colorSwatches = result.product.colorSwatches;
              return product;
            }),
          );
          return updatedProducts;
        } catch (error) {
          console.error('Error fetching product data:', error);
        }
      }
    };
    fetchProductData();
  }, [products]);

  const fetchProductInfo = async (handle) => {
    const response = await fetch(`/api/catalog/products/${handle}`);
    const data = await response.json();
    return data;
  };

  return (
    <div
      className={`featured-product-grid ${
        isHomepageModule ? '' : 'mx-auto'
      } flex flex-row flex-wrap`}
    >
      {title && !isHomepageModule && (
        <h3 className="w-full text-center font-hoefler text-[22px] text-primary">
          {title}
        </h3>
      )}
      <div ref={emblaRef} className="embla">
        <div className="embla__container flex flex-row items-start justify-start gap-[10px] md:ml-[35px] md:mr-[45px] md:gap-[40px]">
          {products &&
            products.map(function (product) {
              let isNewTag = false;
              let isBestsellerTag = false;
              if (
                product[0].store.colorSwatches?.products?.edges[0].node
                  .activation_date?.value
              ) {
                isNewTag = activationDate(
                  product[0].store.colorSwatches?.products?.edges[0].node
                    .activation_date.value,
                );
              }
              if (
                product[0].store.colorSwatches?.products?.edges[0].node
                  .best_seller
              ) {
                isBestsellerTag = true;
              }
              return (
                <div
                  key={uuidv4()}
                  className="embla__slide w-1/2 last:mr-[10px] md:w-1/4 md:last:mr-[40px]"
                >
                  {product.map((p, i) => (
                    <div
                      key={uuidv4()}
                      className="flex flex-col items-center justify-center"
                    >
                      <Link to={`/products/${p.store.slug.current}`}>
                        <div className="mt-[20px]">
                          <Image
                            src={p.store.previewImageUrl}
                            alt={p.store.title}
                            className="product-image"
                          />
                        </div>

                        {/* New & Bestseller badging */}
                        <div className="badge mt-5 flex justify-center gap-[5px] uppercase">
                          {isNewTag && (
                            <div className="inline-block bg-badge p-[8px] text-2xs">
                              New
                            </div>
                          )}
                          {isBestsellerTag && (
                            <div className="inline-block bg-badge p-[8px] text-2xs">
                              Bestseller
                            </div>
                          )}
                        </div>

                        {/* title */}
                        <div className="mt-[10px] text-center text-sm">
                          {p.store.title}
                        </div>
                      </Link>

                      {/* price */}
                      <div className="mt-2 flex flex-row text-xs">
                        {p.store.priceRange.minVariantPrice !==
                          p.store.priceRange.maxVariantPrice && (
                          <div>
                            <span className="text-saleGray line-through">
                              ${p.store.priceRange.minVariantPrice}
                            </span>
                            <span className="px-2">-</span>
                          </div>
                        )}

                        <span className="text-xs">
                          ${p.store.priceRange.maxVariantPrice}
                        </span>
                      </div>

                      {/* Reviews */}
                      {p.store.id && !module.hideReviews && (
                        <div
                          className="ratings-container mt-2"
                          data-bv-show="inline_rating"
                          data-bv-product-id={p.store.id}
                          data-bv-seo="false"
                        ></div>
                      )}

                      {/* Swatches */}
                      <div
                        className={`color-swatches flex flex-wrap items-center justify-center gap-2 pt-4 ${
                          module.hideSwatches ? 'hidden' : ''
                        }`}
                      >
                        {p.store.colorSwatches?.products?.edges
                          .slice(
                            0,
                            showAllSwatchesMap[p.store.id]
                              ? undefined
                              : MAX_SWATCHES_DISPLAYED,
                          )
                          .map(({node}) => {
                            const value = node.options.find(
                              (opt: string) => opt.name === 'Color',
                            )?.values[0];
                            const to = `/products/${node.handle}`;

                            return (
                              <div
                                className={`${
                                  node.options[0].values[0] === 'Default Title'
                                    ? 'hidden'
                                    : ''
                                }`}
                                key={uuidv4()}
                              >
                                {product.isQuickView ? (
                                  <Tippy
                                    placement="top"
                                    render={() => {
                                      return (
                                        <Tooltip
                                          label={node.options[0].values[0]}
                                        />
                                      );
                                    }}
                                    key={uuidv4()}
                                  >
                                    <button
                                      className={clsx([
                                        'flex h-8 w-8 items-center justify-center rounded-full border',
                                        'cursor-pointer hover:border-black hover:border-opacity-30',
                                      ])}
                                      name={node.options[0].name}
                                      value={value}
                                      data-handle={node.handle}
                                    >
                                      <div
                                        className="color-swatch rounded-full"
                                        style={{
                                          height: 'calc(100% - 4px)',
                                          width: 'calc(100% - 4px)',
                                          backgroundImage: `url(${node.metafield?.reference?.image?.url})`,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                        }}
                                      ></div>
                                    </button>
                                  </Tippy>
                                ) : (
                                  <Link
                                    key={uuidv4()}
                                    to={to}
                                    className={clsx([
                                      'flex h-8 w-8 items-center justify-center rounded-full',
                                    ])}
                                  >
                                    <Tippy
                                      placement="top"
                                      render={() => {
                                        return (
                                          <Tooltip
                                            label={node.options[0].values[0]}
                                          />
                                        );
                                      }}
                                      key={uuidv4()}
                                    >
                                      <div
                                        className={clsx([
                                          'flex h-8 w-8 items-center justify-center rounded-full border',
                                          'cursor-pointer hover:border-black hover:border-opacity-30',
                                        ])}
                                      >
                                        <div
                                          className="color-swatch rounded-full"
                                          style={{
                                            height: 'calc(100% - 4px)',
                                            width: 'calc(100% - 4px)',
                                            backgroundImage: `url(${node.metafield?.reference?.image?.url})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                          }}
                                        ></div>
                                      </div>
                                    </Tippy>
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        {/* end colorSwatches */}
                        {p.store.colorSwatches?.products?.edges.length >= 5 && (
                          <div
                            className={clsx([
                              'flex h-8 w-8 items-center justify-center rounded-full border',
                              'cursor-pointer hover:border-black hover:border-opacity-30',
                            ])}
                          >
                            <div
                              className="color-swatch flex justify-center rounded-full"
                              style={{
                                height: 'calc(100% - 4px)',
                                width: 'calc(100% - 4px)',
                              }}
                            >
                              <button
                                className="text-gray-600 hover:text-gray-800 cursor-pointer text-sm focus:outline-none"
                                onClick={() =>
                                  toggleSwatchVisibility(p.store.id)
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
        </div>
      </div>
      <div className="featuredProductsGridArrows flex w-screen items-center justify-center gap-[10px] pt-[20px] md:w-full">
        <PrevButton
          className="pointer-events-auto z-[1] flex h-[40px] w-[30px] cursor-pointer items-center justify-center bg-[#F2F3F5] disabled:opacity-[.3]"
          onClick={scrollPrev}
          disabled={prevBtnDisabled}
        />
        <NextButton
          className="pointer-events-auto z-[1] flex h-[40px] w-[30px] cursor-pointer items-center justify-center bg-[#F2F3F5] disabled:opacity-[.3]"
          onClick={scrollNext}
          disabled={nextBtnDisabled}
        />
      </div>
    </div>
  );
}
