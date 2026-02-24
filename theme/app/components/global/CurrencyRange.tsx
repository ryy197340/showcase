import {Money} from '@shopify/hydrogen';
import {
  MoneyV2,
  ProductPriceRange,
} from '@shopify/hydrogen/storefront-api-types';

type Props = {
  priceRange: ProductPriceRange;
  className?: string;
};

export default function CurrencyRange({priceRange, className}: Props) {
  const minVariantPrice = priceRange.minVariantPrice;
  const maxVariantPrice = priceRange.maxVariantPrice;
  if (priceRange.minVariantPrice.currencyCode === 'USD') {
    return (
      <>
        <Money data={minVariantPrice} className={className} />
        {' - '}
        <Money data={maxVariantPrice} className={className} />
      </>
    );
  } else {
    return (
      <div>
        <span className={className}>{returnCurrency(minVariantPrice)}</span>
        {' - '}
        <span className={className}>{returnCurrency(maxVariantPrice)}</span>
      </div>
    );
  }
}

function returnCurrency(data: MoneyV2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currencyCode,
  }).format(Number(data.amount));
}
