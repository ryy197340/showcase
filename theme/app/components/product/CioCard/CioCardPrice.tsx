import {ProductVariant} from '@shopify/hydrogen/storefront-api-types';

import Currency from '~/components/global/Currency';
import CurrencyRange from '~/components/global/CurrencyRange';

type Props = {
  selectedVariant: ProductVariant | undefined;
};

export default function CioCardPrice({selectedVariant}: Props) {
  return (
    <div className="mt-3 flex min-h-4 justify-center text-[11px]">
      {selectedVariant && selectedVariant.compareAtPrice && (
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
          <Currency
            data={selectedVariant.price}
            className={selectedVariant.compareAtPrice ? 'text-sale' : ''}
          />
        ))}
    </div>
  );
}
