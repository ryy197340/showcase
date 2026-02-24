import {ShopifyAnalyticsPayload} from '@shopify/hydrogen';
import {Product, ProductVariant} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import {useContext, useEffect, useState} from 'react';

import Badge from '~/components/elements/Badge';
import FreeReturnsIcon from '~/components/icons/FreeReturnsIcon';
import FreeShippingIcon from '~/components/icons/FreeShippingIcon';
import CompleteTheLook from '~/components/product/CompleteTheLook';
import ProductForm from '~/components/product/Form';
import HelpIsHere from '~/components/product/HelpIsHere';
import TabbedContent from '~/components/product/TabbedContent';
import type {PDPGlobalModules, SanityProductPage} from '~/lib/sanity';
import {GlobalContext} from '~/lib/utils';

import Currency from '../global/Currency';
import CurrencyRange from '../global/CurrencyRange';

type Props = {
  sanityProduct: SanityProductPage;
  storefrontProduct: Product;
  storefrontVariants: ProductVariant[];
  selectedVariant: ProductVariant;
  analytics: ShopifyAnalyticsPayload;
  pdpGlobalModules?: PDPGlobalModules[];
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
};
function ProductPrices({
  storefrontProduct,
  selectedVariant,
  isModalOpen,
  setIsModalOpen,
}: {
  storefrontProduct: Product;
  selectedVariant: ProductVariant;
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
}) {
  const [discountPercent, setDiscountPercent] = useState(0);
  const {locale} = useContext(GlobalContext);
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
    <div className="flex flex-col flex-wrap items-start justify-start gap-x-[2px] gap-y-2.5 text-md">
      <div className="flex flex-row">
        {selectedVariant.compareAtPrice &&
          parseFloat(selectedVariant.compareAtPrice.amount) > 0 && (
            <span className="saleGray mr-2 text-saleGray">
              <s style={{textDecorationThickness: 1}}>
                <Currency data={selectedVariant.compareAtPrice} />
              </s>
            </span>
          )}
        {selectedVariant.price &&
          (selectedVariant.product.handle === 'digital-gift-card' ? (
            <div className="flex flex-row">
              <CurrencyRange priceRange={selectedVariant.product.priceRange} />
            </div>
          ) : (
            <Currency data={selectedVariant.price} />
          ))}
        {selectedVariant.compareAtPrice &&
          parseFloat(selectedVariant.compareAtPrice.amount) > 0 && (
            <div className="pl-2 md:w-auto">
              <span className="mr-2 text-red"> Save {discountPercent}%</span>
            </div>
          )}
      </div>
    </div>
  );
}

export default function ProductWidget({
  sanityProduct,
  storefrontProduct,
  storefrontVariants,
  selectedVariant,
  analytics,
  pdpGlobalModules,
  isModalOpen,
  setIsModalOpen,
}: Props) {
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
        storefrontProduct.tags.map(function (el) {
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
        <h1 className="pb-2 text-[24px] font-light lg:text-xl">
          {storefrontProduct.title}
        </h1>
      )}

      {/* Reviews (TODO: Move/style this appropriately) (side ProductPrices */}

      {/* Prices */}
      <ProductPrices
        storefrontProduct={storefrontProduct}
        selectedVariant={selectedVariant}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
      {/* Divider */}
      <div className="my-4 w-full border-b border-gray" />

      {/* Product options */}
      <ProductForm
        product={storefrontProduct}
        variants={storefrontVariants}
        selectedVariant={selectedVariant}
        analytics={analytics}
        customProductOptions={sanityProduct.customProductOptions}
        pdpGlobalModules={pdpGlobalModules}
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

      {/* Details - Tabbed Content */}
      <div>
        <TabbedContent
          selectedVariant={selectedVariant}
          storefrontProduct={storefrontProduct}
          sanityProduct={sanityProduct}
        />
      </div>

      {/* Complete the look */}
      <CompleteTheLook />
      {/* Help is here */}
      <HelpIsHere />
    </div>
  );
}
