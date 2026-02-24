import {Image} from '@shopify/hydrogen';
import type {Product} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import {useContext, useEffect, useRef, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

import ProductGallery from '~/components/product/GalleryQuickView';
import ProductWidget from '~/components/product/WidgetCatalog';
import {useEnv} from '~/hooks/useEnv';
import {VariationsMap} from '~/lib/constructor/types';
import {GlobalContext} from '~/lib/utils';
import type {ProductWithNodes} from '~/types/shopify';

import {FacetCaret} from '../icons/FacetCaret';

type ExtendedProduct = Product & {
  selectedVariant?: any;
  isQuickView?: boolean;
  isCatalog?: boolean;
};

type Props = {
  // Collection PLP Quick View
  data: any;
  products: ExtendedProduct[];
  relatedProducts?: ExtendedProduct[];
  title?: string;
  variationsMap?: VariationsMap;
  currentProductUrl?: string;
  setActiveProduct?: () => void;
  primaryProduct?: ExtendedProduct;
  closeModal?: () => void;
};

export default function ProductDetailsCard({
  data,
  products,
  relatedProducts = [],
  title,
  variationsMap,
  currentProductUrl,
  setActiveProduct,
  primaryProduct,
}: Props) {
  const [currentProductHandle, setCurrentProductHandle] = useState(data.handle);
  const [updatedColorProduct, setUpdatedColorProduct] = useState<
    ProductWithNodes | undefined
  >(data);
  const [selectedVariant, setSelectedVariant] = useState<
    ProductWithNodes | undefined
  >(undefined);
  const [availableForSale, setAvailableForSale] = useState(false);
  const {APTOS_QTY_THRESHOLD} = useEnv();
  const threshold: number = parseFloat(APTOS_QTY_THRESHOLD);

  const itemVariants: any = [];
  const {locale} = useContext(GlobalContext);

  const galleryRef = useRef<HTMLDivElement>(null);
  const [isAtEnd, setIsAtEnd] = useState(false);

  useEffect(() => {
    const selectedProduct = products.find(
      (el: any) => el.handle === currentProductHandle,
    );
    if (selectedProduct) {
      // Choose first available variant by comparing quantity against aptosThreshold
      const firstAvailableVariantAboveAptosThreshold =
        selectedProduct.variants.nodes.find(
          (variant: any) =>
            variant.availableForSale &&
            (variant.aptosQty ? variant.aptosQty - threshold > 0 : true) &&
            (variant.quantityAvailable
              ? variant.quantityAvailable > threshold
              : true),
        ) ?? selectedProduct.variants.nodes[0];
      selectedProduct.selectedVariant =
        firstAvailableVariantAboveAptosThreshold;
      selectedProduct.isQuickView = true;
      selectedProduct.isCatalog = true;
      selectedProduct.variants.nodes.forEach((element: object) => {
        itemVariants.push(element);
      });
      setSelectedVariant(firstAvailableVariantAboveAptosThreshold);
      setUpdatedColorProduct(selectedProduct);
      setAvailableForSale(
        firstAvailableVariantAboveAptosThreshold.availableForSale,
      );
    } else {
      fetch(`${locale.pathPrefix}/api/products/${currentProductHandle}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => {
          // Handle the response from the server
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
          // Handle the successful submission response
        })
        .then((data: any) => {
          if (data.product) {
            data.product.isQuickView = true;
            data.product.isCatalog = true;
            data.product.variants.nodes.forEach((element: object) => {
              itemVariants.push(element);
            });
            setSelectedVariant(data.product.variants.nodes[0]);
            setUpdatedColorProduct(data.product);
            setAvailableForSale(
              data.product.variants.nodes[0].availableForSale,
            );
            const productArray = products;
            productArray.push(data.product);
          }
        })
        .catch((error) => {
          // Handle any errors that occur during the submission process
          console.error('Error submitting the form:', error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProductHandle, updatedColorProduct, locale.pathPrefix]);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;

    const checkEnd = () => {
      const isDesktop = window.innerWidth >= 1024;

      if (isDesktop) {
        setIsAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 1);
      } else {
        setIsAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
      }
    };

    checkEnd();

    el.addEventListener('scroll', checkEnd);
    window.addEventListener('resize', checkEnd);

    return () => {
      el.removeEventListener('scroll', checkEnd);
      window.removeEventListener('resize', checkEnd);
    };
  }, [relatedProducts]);

  const totalProducts =
    (relatedProducts?.length ?? 0) + (primaryProduct ? 1 : 0);
  const shouldShowScrollButton = totalProducts > 3;

  return (
    <div className="card-catalog-container page-width flex flex-col overflow-x-hidden md:h-[680px] lg:flex-row">
      {/* Mobile Title */}
      {title && updatedColorProduct && relatedProducts && (
        <div className="pb-[8px]  lg:hidden">
          <h1 className="text-[22px] leading-[28px]">Related Styles</h1>
        </div>
      )}
      {/* Product Sidebar */}
      {((data && primaryProduct) || relatedProducts) && (
        <div className="relative mb-2 mr-5 w-full md:mr-0 lg:mb-0 lg:w-1/5">
          <div
            className="flex max-h-[600px] w-[90%] flex-row gap-[10px] overflow-x-auto pr-2 lg:w-full lg:flex-col lg:overflow-y-auto"
            ref={galleryRef}
          >
            {data && (
              <button
                onClick={() => {
                  setActiveProduct(primaryProduct);
                  setUpdatedColorProduct(primaryProduct);
                  setCurrentProductHandle(primaryProduct.handle);
                }}
                className="shrink-0 lg:shrink"
              >
                <Image
                  src={`${primaryProduct.media.nodes[0].image.url}`}
                  height="auto"
                  width="100px"
                />
              </button>
            )}

            {relatedProducts &&
              relatedProducts.map((item) => (
                <button
                  key={uuidv4()}
                  onClick={() => {
                    setActiveProduct(item);
                    setUpdatedColorProduct(item);
                    setCurrentProductHandle(item.handle);
                  }}
                  className="shrink-0 lg:shrink"
                >
                  {item?.media && (
                    <Image
                      src={`${item.media.nodes[0].image.url}`}
                      height="auto"
                      width="100px"
                    />
                  )}
                </button>
              ))}
          </div>

          {shouldShowScrollButton && (
            <div className="absolute bottom-5 left-0 right-0 hidden bg-gradient-to-t from-white via-white/80 to-transparent pb-2 pl-[10%] text-center lg:block">
              <button
                disabled={isAtEnd}
                onClick={() => {
                  if (galleryRef.current) {
                    galleryRef.current.scrollBy({top: 150, behavior: 'smooth'});
                  }
                }}
                className={clsx(
                  'flex flex-col items-center gap-[5px] text-xs underline',
                  isAtEnd && 'cursor-not-allowed no-underline opacity-40',
                )}
              >
                View More
                <FacetCaret />
              </button>
            </div>
          )}

          {/* Mobile: Right-side "View More" */}
          {shouldShowScrollButton && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-white via-white/80 to-transparent px-2 lg:hidden">
              <button
                disabled={isAtEnd}
                onClick={() => {
                  if (galleryRef.current) {
                    galleryRef.current.scrollBy({
                      left: 150,
                      behavior: 'smooth',
                    });
                  }
                }}
                className={clsx(
                  'flex flex-col items-center gap-[5px] bg-[#F2F3F5]',
                  isAtEnd && 'cursor-not-allowed opacity-40',
                )}
              >
                <div className="mx-[2px] my-[10px] -rotate-90">
                  <FacetCaret />
                </div>
              </button>
            </div>
          )}
        </div>
      )}
      {/* Divider */}
      <div className="my-4 w-full border-b border-gray lg:hidden" />

      {/* Gallery */}
      <ProductGallery
        storefrontProduct={updatedColorProduct}
        selectedVariant={selectedVariant}
      />

      {/* Mobile Title */}
      {title && updatedColorProduct && (
        <div className="lg:hidden">
          <h1 className="text-[24px] leading-[28px]">
            {selectedVariant?.product?.title}
          </h1>
        </div>
      )}

      {/* Widget (desktop) */}
      {updatedColorProduct && (
        <div
          className={clsx('h-full lg:w-1/2', 'lg:float-right lg:inline-block')}
        >
          <div className="">
            <div className="w-full justify-start pb-4 md:pl-4">
              <ProductWidget
                data={data}
                storefrontProduct={updatedColorProduct}
                title={title}
                colorSwatches={variationsMap}
                selectedVariant={selectedVariant}
                availableForSale={availableForSale}
                variants={updatedColorProduct.variants.nodes}
                setCurrentProductHandle={setCurrentProductHandle}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
