import {CurrencyCode, MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import {SearchProduct} from '@xgenai/sdk-core/dist/types/search';

export const productCompareAtPrice = (
  data: SearchProduct,
  currencyCode: CurrencyCode,
): MoneyV2 | null => {
  if (data.compare_at_price_varies) {
    if (parseFloat(data.compare_at_price as string) > 0) {
      return {amount: `${data.compare_at_price}`, currencyCode};
    }
  } else if (!isNaN(data.sale_price) && data.price !== data.sale_price) {
    return {amount: `${data.price}`, currencyCode};
  }
  return null;
};
