import {json, LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {validateLocale} from '~/lib/utils';
import {getProductPrices} from '~/queries/shopify/product';
import {AdjustedPriceData, PriceData} from '~/types/shopify';

export async function loader({context, request, params}: LoaderFunctionArgs) {
  try {
    validateLocale({context, params});
    const url = new URL(request.url);
    const ids = url.searchParams.getAll('ids');
    if (ids.length === 0) return;
    const pricesQuery = getProductPrices(ids);
    const queryResult = await context.storefront.query(pricesQuery);
    const prices = queryResult.nodes;
    const adjustedPrices = transformPrices(prices);
    return json(adjustedPrices);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in loader function:', error);
    return {adjustedPrices: []};
  }
}

function transformPrices(prices: PriceData[]): AdjustedPriceData {
  return prices.reduce((priceMap, price) => {
    const strippedId = price?.id.replace('gid://shopify/Product/', '');
    const {minVariantPrice, maxVariantPrice} = price.priceRange;
    const {minVariantPrice: compareMin, maxVariantPrice: compareMax} =
      price.compareAtPriceRange;

    priceMap[strippedId] = {
      ...price,
      isOnSaleMin: isOnSale(
        compareMin.amount.toString(),
        minVariantPrice.amount.toString(),
      ),
      isOnSaleMax: isOnSale(
        compareMax.amount.toString(),
        maxVariantPrice.amount.toString(),
      ),
      hasPriceRange: minVariantPrice.amount !== maxVariantPrice.amount,
    };

    return priceMap;
  }, {} as AdjustedPriceData);
}

function isOnSale(comparePrice: string, actualPrice: string): boolean {
  const compare = parseFloat(comparePrice);
  const actual = parseFloat(actualPrice);
  return compare > 0 && compare !== actual && compare > actual;
}
