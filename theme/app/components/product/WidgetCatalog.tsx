import {ShopifyAnalyticsPayload} from '@shopify/hydrogen';
import {Product, ProductVariant} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import {useContext, useEffect, useState} from 'react';

import Badge from '~/components/elements/Badge';
import FreeReturnsIcon from '~/components/icons/FreeReturnsIcon';
import FreeShippingIcon from '~/components/icons/FreeShippingIcon';
import ProductForm from '~/components/product/FormCatalog';
import {GlobalContext} from '~/lib/utils';
import type {CollectionWithNodes, ProductWithNodes} from '~/types/shopify';
import {stripGlobalId} from '~/utils';

import Currency from '../global/Currency';

type Props = {
  storefrontProduct: Product;
  storefrontVariants: ProductVariant[];
  selectedVariant: ProductVariant;
  analytics: ShopifyAnalyticsPayload;
  relatedProducts: ProductWithNodes[];
  colorSwatches?: CollectionWithNodes;
  setCurrentProductHandle?: () => void;
};
function ProductPrices({
  storefrontProduct,
  selectedVariant,
}: {
  storefrontProduct: Product;
  selectedVariant: ProductVariant;
}) {
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    if (selectedVariant.compareAtPrice && selectedVariant.price) {
      const compareAtPrice: number = parseFloat(
        selectedVariant.compareAtPrice.amount,
      );
      const price: number = parseFloat(selectedVariant.price.amount);
      const calculatedDiscount: number =
        ((compareAtPrice - price) / compareAtPrice) * 100;
      setDiscountPercent(Math.round(calculatedDiscount));
    }
  }, [selectedVariant.compareAtPrice, selectedVariant.price]);

  if (!storefrontProduct || !selectedVariant) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-row flex-wrap items-center justify-start gap-[2px] text-md">
      {selectedVariant.compareAtPrice && (
        <span className="saleGray mr-2 text-saleGray">
          <s style={{textDecorationThickness: 1}}>
            <Currency data={selectedVariant.compareAtPrice} />
          </s>
        </span>
      )}
      {selectedVariant.price && <Currency data={selectedVariant.price} />}
      {selectedVariant.compareAtPrice && (
        <div className="w-full md:w-auto md:pl-2">
          <span className="mr-2 text-red"> Save {discountPercent}%</span>
        </div>
      )}
      <div
        className="reviews-container"
        data-bv-show="rating_summary"
        data-bv-product-id={stripGlobalId(storefrontProduct.id)}
      ></div>
    </div>
  );
}

export default function ProductWidget({
  storefrontProduct,
  storefrontVariants,
  selectedVariant,
  analytics,
  relatedProducts,
  colorSwatches,
  setCurrentProductHandle,
}: Props) {
  const availableForSale = selectedVariant?.availableForSale;
  const {locale} = useContext(GlobalContext);

  if (!selectedVariant) {
    return null;
  }
  return (
    <div
      className={clsx(
        'pointer-events-auto z-10 ml-auto rounded bg-white px-0 md:px-0 md:pb-6',
        'lg:px-6',
      )}
    >
      {/* Tags */}
      {storefrontProduct?.tags &&
        storefrontProduct.tags.map(function (el, index) {
          if (el === 'new') {
            return (
              <div className="hidden uppercase lg:block" key={el}>
                <Badge mode="outline" label="New" small solid={true} />
              </div>
            );
          }
          return null;
        })}

      {/* Title */}
      {storefrontProduct?.title && (
        <h1 className="hidden pb-4 text-xl font-light lg:block">
          {storefrontProduct.title}
        </h1>
      )}

      {/* Reviews (TODO: Move/style this appropriately) (side ProductPrices */}

      {/* Prices */}
      <ProductPrices
        storefrontProduct={storefrontProduct}
        selectedVariant={selectedVariant}
      />
      {/* Divider */}
      <div className="my-4 w-full border-b border-gray" />

      {/* Product options */}
      <ProductForm
        product={storefrontProduct}
        variants={storefrontProduct.variants.nodes}
        selectedVariant={selectedVariant}
        analytics={analytics}
        availableForSale={availableForSale}
        colorSwatches={colorSwatches}
        setCurrentProductHandle={setCurrentProductHandle}
      />

      {/* Free Ground Shipping & Returns Text center*/}
      {locale.country === 'US' && (
        <div className="flex w-full flex-col content-center justify-center gap-2 border-b border-gray py-[18px] lg:flex lg:flex-row">
          <div className="flex items-center gap-1">
            <FreeShippingIcon />
            <span className="px-1 text-xs md:text-1xs">
              Free Ground Shipping over $‌150
            </span>
          </div>
          <div className="flex items-center gap-1 pt-2 lg:pt-0">
            <FreeReturnsIcon />
            <span className="px-1  text-xs md:text-1xs">
              Free Returns In Store (for US Orders)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
