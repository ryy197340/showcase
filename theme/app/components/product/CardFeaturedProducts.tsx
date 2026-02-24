import {Image, Money} from '@shopify/hydrogen';
import type {ProductVariant} from '@shopify/hydrogen/storefront-api-types';
import {Product} from '@shopify/hydrogen/storefront-api-types';
import Tippy from '@tippyjs/react/headless';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import {useContext, useEffect, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

import Tooltip from '~/components/elements/Tooltip';
import {usePrevNextButtons} from '~/components/modules/EmblaCarouselArrowButtons';
import {VariationsMap} from '~/lib/constructor/types';
import {ColorSwatches, ProductWithColorSwatches} from '~/lib/shopify/types';
import {GlobalContext} from '~/lib/utils';
import {stripGlobalId} from '~/utils';

import Currency from '../global/Currency';
import LocalizedA from '../global/LocalizedA';
import PlusIcon from '../icons/Plus';
import Tags from './Tags';

type Props = {
  product: ProductWithColorSwatches & {activation_date?: string} & {
    bestSeller?: any;
  } & {
    preorderMessage?: {
      value: string;
    };
  };
  setProduct: (product: Product) => void;
  currentProductUrl?: string;
  setCurrentProductUrl?: (url: string) => void;
  setVariationsMap: (variationsMap: any) => void;
  products?: ProductWithColorSwatches[];
  setProducts: (products: ProductWithColorSwatches[]) => void;
  setIsModalOpen?: (isOpen: boolean) => void;
  hideReviews?: boolean;
  hideSwatches?: boolean;
};

export default function FeaturedProductsCard({
  product,
  setProduct,
  setCurrentProductUrl,
  setVariationsMap,
  products,
  setProducts,
  setIsModalOpen,
  hideReviews,
  hideSwatches,
}: Props) {
  const {locale} = useContext(GlobalContext);
  const [showAllSwatchesMap, setShowAllSwatchesMap] = useState({});
  const openModal = function (selectedProduct: ProductWithColorSwatches) {
    if (setIsModalOpen) setIsModalOpen(true);
    setProduct(selectedProduct);
    if (setCurrentProductUrl)
      setCurrentProductUrl(
        `${locale.pathPrefix}/products/${selectedProduct.handle}`,
      );
    const variationsMap: VariationsMap = {};

    selectedProduct.colorSwatches.products.edges.forEach(
      (item: {node: any}) => {
        const node = item.node;
        const colorOption = node.options.find(
          (option: {name: string}) => option.name === 'Color',
        );
        if (
          colorOption &&
          colorOption.values &&
          colorOption.values.length > 0
        ) {
          const color = colorOption.values[0];
          const formattedColor = color.replace(/\s/g, '/');
          if (variationsMap)
            variationsMap[formattedColor] = {
              firstImage: node.metafield.reference.image.url,
              swatch_image: node.metafield.reference.image.url,
              minPrice: 125,
              maxPrice: 125,
              shopify_id: parseInt(node.id.split('/').pop()),
              url: `${locale.pathPrefix}/products/${node.handle}`,
            };
        }
      },
    );

    setVariationsMap(variationsMap); // This is set w/ Shopify data
  };

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    slidesToScroll: 1,
  });
  usePrevNextButtons(emblaApi);
  const variations_map: VariationsMap = {};
  const [colorSwatches, setColorSwatches] = useState<
    ColorSwatches | Record<string, never>
  >({});
  useEffect(() => {
    (async () => {
      const family = product.tags.find((tag) =>
        tag.toUpperCase().includes('FAMILY'),
      );

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

      const swatchData = await getColorSwatches(family);

      setColorSwatches(swatchData);
    })();
    // add a "product" dependency so that the swatches will change on
    // FormCatalog too
  }, [product]);

  if (colorSwatches.colorSwatches) {
    colorSwatches.colorSwatches.products.edges.forEach((item) => {
      const node = item.node;
      const colorOption = node.options.find(
        (option) => option.name === 'Color',
      );
      if (colorOption && colorOption.values && colorOption.values.length > 0) {
        const color = colorOption.values[0];
        const formattedColor = color.replace(/\s/g, '/');
        if (node?.metafield?.reference)
          variations_map[formattedColor] = {
            firstImage: node.metafield.reference.image.url,
            swatch_image: node.metafield.reference.image.url,
            minPrice: 125,
            maxPrice: 125,
            shopify_id: parseInt(node.id.split('/').pop()),
            url: `${locale.pathPrefix}/products/${node.handle}`,
          };
      }
    });
  }

  const [updatedColorProduct, setUpdatedColorProduct] =
    useState<ProductWithColorSwatches>();

  const [selectedVariant, setSelectedVariant] = useState<
    ProductVariant | undefined
  >(undefined);
  const [isNewProduct, setIsNewProduct] = useState<boolean | null>(null);
  const [isBestSeller, setIsBestseller] = useState<boolean | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string | undefined>('');
  const [currentProductHandle, setCurrentProductHandle] = useState<string>('');
  const [selectedSwatch, setSelectedSwatch] = useState<string>('');

  useEffect(() => {
    if (product) {
      const updatedProduct = {
        ...product,
        selectedVariant: product.variants.nodes[0],
        isQuickView: true,
      };
      setCurrentProductHandle(product.handle);
      setSelectedVariant(product.variants.nodes[0]);
      setUpdatedColorProduct(updatedProduct);
      const isNewProductTag =
        Date.now() -
          new Date(
            product.activation_date ? product.activation_date : '',
          ).getTime() <
        30 * 24 * 60 * 60 * 1000;
      const isBestSellerTag = product.bestSeller?.value === 'true';
      setIsNewProduct(isNewProductTag);
      setIsBestseller(isBestSellerTag);
      setBackImageUrl(updatedProduct?.back_image?.reference?.image?.url);
      // Set the selected swatch to the correct color
      const colorOption = product.options.find(
        (option) => option.name === 'Color',
      );
      const color =
        colorOption && colorOption.values ? colorOption.values[0] : '';
      const colorOptionIndex = product.colorSwatches?.products?.edges.findIndex(
        (edge) =>
          edge.node.options.some(
            (option) =>
              option.name === 'Color' && option.values.includes(color),
          ),
      );
      const selectedSwatchAndIndex = color + colorOptionIndex;
      setSelectedSwatch(selectedSwatchAndIndex);
    }
  }, [product, colorSwatches]);

  const updateProductDetails = (product) => {
    // Logic to set new product details
    const isNewProduct =
      Date.now() - new Date(product.publishedAt).getTime() <
      30 * 24 * 60 * 60 * 1000;
    const isBestSeller = product.bestSeller?.value === 'true';
    setIsNewProduct(isNewProduct);
    setIsBestseller(isBestSeller);
    setSelectedVariant(product.variants.nodes[0]);
    setUpdatedColorProduct(product);
    setBackImageUrl(product?.back_image?.reference?.image?.url);
  };

  const updateColorSwatch = async (key: string, node: any) => {
    const newProductUrl = `${locale.pathPrefix}/products/${node.handle}`;
    setCurrentProductUrl && setCurrentProductUrl(newProductUrl);
    setCurrentProductHandle(node.handle);
    setSelectedSwatch(key);

    const selectedProduct = products?.find((p) => p.handle === node.handle);
    if (selectedProduct) {
      updateProductDetails({...selectedProduct, isQuickView: true});
      return;
    }

    try {
      const response = await fetch(
        `${locale.pathPrefix}/api/products/${node?.handle}`,
        {
          method: 'GET',
          headers: {'Content-Type': 'application/json'},
        },
      );
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (data.product) {
        updateProductDetails({...data.product, isQuickView: true});
        setProducts((prevProducts: any) => [...prevProducts, data.product]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  return (
    <div className="page-width">
      <div className="featured-product-grid page-width flex flex-row">
        <div ref={emblaRef} className="embla">
          <div className="embla__container flex flex-col gap-[10px]">
            <div key={uuidv4()} className="embla__slide group w-full">
              <div
                key={uuidv4()}
                className="flex flex-col items-center justify-center"
              >
                <div className="group/image relative mt-[20px] overflow-hidden">
                  <LocalizedA
                    href={`${locale.pathPrefix}/products/${updatedColorProduct?.handle}`}
                  >
                    {updatedColorProduct?.media?.nodes[0]?.image && (
                      <Image
                        src={updatedColorProduct.media.nodes[0].image?.url}
                        alt={updatedColorProduct?.title}
                        className="product-image"
                        height={
                          updatedColorProduct.media.nodes[0].image?.height
                        }
                        width={updatedColorProduct.media.nodes[0].image?.width}
                      />
                    )}
                    {backImageUrl &&
                      updatedColorProduct?.back_image?.reference?.image && (
                        <div className="absolute left-0 top-0 hidden h-full w-full translate-y-full transition-all duration-500 ease-in-out group-hover/image:block group-hover/image:translate-y-0">
                          <Image
                            className="h-full w-full object-cover"
                            src={backImageUrl}
                            alt="back image"
                            loading="lazy"
                            height={
                              updatedColorProduct.back_image.reference.image
                                ?.height
                            }
                            width={
                              updatedColorProduct.back_image.reference.image
                                ?.width
                            }
                          />
                        </div>
                      )}
                  </LocalizedA>
                  <div
                    className={clsx(
                      'absolute bottom-0 w-full translate-y-full items-center justify-center bg-white text-xs duration-200 ease-in-out group-hover:flex',
                      'opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
                    )}
                  >
                    <button
                      onClick={() => openModal(product)}
                      className="w-full py-4"
                    >
                      QUICK VIEW
                      <span className="absolute right-0 top-1/2 my-auto mr-[10px] -translate-y-1/2 transform">
                        <PlusIcon />
                      </span>
                    </button>
                  </div>
                </div>

                {/* Pre-order */}
                {product?.preorderMessage && (
                  <div className="mb-[-5px] mt-[20px] flex justify-center text-xs font-bold uppercase text-[#6495ed]">
                    {product.preorderMessage.value}
                  </div>
                )}

                {/* Tags */}
                <div className="badge mt-[20px] flex gap-[10px] uppercase">
                  <Tags
                    isNewProduct={isNewProduct}
                    isBestSeller={isBestSeller}
                  />
                </div>

                {/* Title */}
                <div className="mt-[10px] flex justify-center"></div>
                <LocalizedA
                  href={`${locale.pathPrefix}/products/${updatedColorProduct?.handle}`}
                >
                  <div className="text-center text-sm">{product.title}</div>
                </LocalizedA>

                {/* Price */}
                <div className="mt-[10px] text-xs text-primary">
                  <span className="flex flex-row text-xs">
                    {selectedVariant && selectedVariant?.compareAtPrice && (
                      <span className="saleGray mr-2 text-saleGray">
                        <s style={{textDecorationThickness: 1}}>
                          <Currency data={selectedVariant.compareAtPrice} />
                        </s>
                      </span>
                    )}
                    {selectedVariant && selectedVariant.price && (
                      <Money
                        data={selectedVariant.price}
                        className={
                          selectedVariant.compareAtPrice ? 'text-sale' : `resto`
                        }
                      />
                    )}
                  </span>
                </div>

                {/* Reviews */}
                {updatedColorProduct && !hideReviews && (
                  <div
                    className="ratings-container mt-[10px]"
                    data-bv-show="inline_rating"
                    data-bv-product-id={stripGlobalId(updatedColorProduct.id)}
                    data-bv-seo="false"
                  ></div>
                )}

                {/* Swatches */}
                <div
                  className={`color-swatches mt-[10px] flex flex-wrap items-center justify-center gap-2 ${
                    hideSwatches ? 'hidden' : ''
                  }`}
                >
                  {colorSwatches.colorSwatches?.products?.edges
                    .slice(0, showAllSwatchesMap[product.id] ? undefined : 4)
                    .map(({node}, index) => {
                      const value = node.options.find(
                        (opt: string) => opt.name === 'Color',
                      )?.values[0];
                      const key = node?.options?.[0]?.values?.[0] + index;
                      return (
                        <div
                          className={`${
                            node.options[0].values[0] === 'Default Title'
                              ? 'hidden'
                              : ''
                          }`}
                          key={key}
                        >
                          {updatedColorProduct?.isQuickView ? (
                            <Tippy
                              placement="top"
                              render={() => {
                                return (
                                  <Tooltip label={node.options[0].values[0]} />
                                );
                              }}
                              key={key}
                            >
                              <button
                                className={clsx([
                                  'flex h-8 w-8 items-center justify-center rounded-full',
                                  'cursor-pointer hover:border-black hover:border-opacity-30',
                                  {
                                    border: key === selectedSwatch,
                                  },
                                ])}
                                name={node.options[0].name}
                                value={value}
                                data-handle={node.handle}
                                onClick={() => updateColorSwatch(key, node)}
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
                            <button
                              key={key}
                              aria-label={key}
                              className={clsx([
                                'flex h-8 w-8 items-center justify-center rounded-full',
                              ])}
                              onClick={() => updateColorSwatch(key, node)}
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
                                key={key}
                              >
                                <div
                                  className={clsx([
                                    'flex h-8 w-8 items-center justify-center rounded-full border',
                                    'cursor-pointer hover:border-black hover:border-opacity-30',
                                    {
                                      'border-black border-opacity-30':
                                        key === selectedSwatch,
                                    },
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
                            </button>
                          )}
                        </div>
                      );
                    })}
                  {/* end colorSwatches */}
                  {colorSwatches.colorSwatches?.products?.edges?.length >=
                    5 && (
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
                        <button className="text-gray-600 hover:text-gray-800 cursor-pointer text-sm focus:outline-none">
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
