import {
  CurrencyCode,
  MoneyV2,
  ProductVariant,
} from '@shopify/hydrogen/storefront-api-types';
import {SearchProduct} from '@xgenai/sdk-core/dist/types/search';
import {useEffect, useState} from 'react';

import Currency from '~/components/global/Currency';
import CurrencyRange from '~/components/global/CurrencyRange';
import {productCompareAtPrice} from '~/utils/productCompareAtPrice';

/**
 * Computes the price range for a product from the SearchProduct data from XGen
 * @param data - The SearchProduct data from XGen
 * @returns The price range for the product
 */
function getPriceRange(data: SearchProduct, currencyCode: CurrencyCode) {
  const priceMin = parseFloat(String(data.price_min || data.price));
  const priceMax = parseFloat(String(data.price_max || data.price));

  if (isNaN(priceMin) || isNaN(priceMax) || priceMin >= priceMax) {
    return null;
  }

  return {
    minVariantPrice: {
      amount: `${priceMin}`,
      currencyCode,
    },
    maxVariantPrice: {
      amount: `${priceMax}`,
      currencyCode,
    },
  };
}

export default function ProductPrices({
  data,
  selectedVariant,
}: {
  data: SearchProduct;
  selectedVariant?: ProductVariant;
}) {
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    if (
      selectedVariant &&
      selectedVariant?.compareAtPrice &&
      parseFloat(selectedVariant?.compareAtPrice.amount) > 0 &&
      selectedVariant.price
    ) {
      const compareAtPrice: number = parseFloat(
        selectedVariant.compareAtPrice.amount,
      );
      const price: number = parseFloat(selectedVariant.price.amount);
      const calculatedDiscount: number =
        ((compareAtPrice - price) / compareAtPrice) * 100;
      setDiscountPercent(Math.round(calculatedDiscount));
    }
  }, [selectedVariant]);

  if (!data && !selectedVariant) {
    return null;
  }
  // add conditional for having data present, but not selectedVariant
  if (data && !selectedVariant) {
    const retailNumber = data.price || data.variants[0].price;

    const currencyCode = window.GLBE_PARAMS.currencyCode;

    const price = {
      amount: `${retailNumber}`,
      currencyCode,
    };

    const salePrice = {
      amount: `${
        isNaN(data.sale_price as number)
          ? parseFloat(data.compare_at_price as string)
          : data.sale_price
      }`,
      currencyCode,
    };

    const compareAtPrice = productCompareAtPrice(data, currencyCode) as MoneyV2;

    // Compute price range for digital gift card
    // Note: `data` is the SearchProduct result from XGen, not the Shopify product. Therefore, we need
    // to compute the price range from the `price_min` and `price_max` fields.
    const priceRange =
      data.type === 'Gift Card' ? getPriceRange(data, currencyCode) : undefined;

    return (
      <div className="mt-2 flex flex-row items-center gap-2 gap-x-[7px] text-[11px]">
        {compareAtPrice && (
          <span className="line-through opacity-50">
            <Currency data={compareAtPrice} />
          </span>
        )}
        {priceRange ? (
          <div className="flex flex-row gap-x-0">
            <CurrencyRange priceRange={priceRange} />
          </div>
        ) : (
          <Currency
            className={`${compareAtPrice ? 'text-red' : ''}`}
            data={compareAtPrice ? salePrice : price}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-[2px] text-md">
      {selectedVariant &&
        selectedVariant.compareAtPrice &&
        parseFloat(selectedVariant.compareAtPrice.amount) > 0 && (
          <span className="saleGray mr-2 text-saleGray">
            <s style={{textDecorationThickness: 1}}>
              <Currency data={selectedVariant.compareAtPrice} />
            </s>
          </span>
        )}
      {selectedVariant &&
        selectedVariant.price &&
        (selectedVariant.product.handle === 'digital-gift-card' ? (
          <CurrencyRange priceRange={selectedVariant.product.priceRange} />
        ) : (
          <Currency data={selectedVariant.price} />
        ))}
      {selectedVariant &&
        selectedVariant.compareAtPrice &&
        parseFloat(selectedVariant.compareAtPrice.amount) > 0 && (
          <div className="w-full md:w-auto md:pl-2">
            <span className="mr-2 text-red"> Save {discountPercent}%</span>
          </div>
        )}
    </div>
  );
}
