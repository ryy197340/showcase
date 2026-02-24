import {RecommendProduct} from '@xgenai/sdk-core/dist/types/recommend';
import {useCallback, useContext, useEffect, useRef, useState} from 'react';

import {fetchShopifyPrices, GlobalContext, returnPriceData} from '~/lib/utils';
import {AdjustedPriceData} from '~/types/shopify';

import BestSellerCard from '../cart/BestSellerCard';

export function RecommendationsResults(props: {
  items: RecommendProduct[];
  isRestingSearch: boolean;
}) {
  const {items, isRestingSearch} = props;
  const [priceData, setPriceData] = useState<AdjustedPriceData>({});
  const shopifyIds = items.map((item) => Number(item.prod_code));
  const {locale} = useContext(GlobalContext);
  const validShopifyIds = shopifyIds.filter(
    (id) => id !== undefined,
  ) as number[];
  const fetchPrices = useCallback(async () => {
    const fetchedData = await fetchShopifyPrices(validShopifyIds, locale);
    if (fetchedData) {
      setPriceData(fetchedData);
    }
  }, [validShopifyIds, locale]);

  const fetchedRef = useRef(false);

  useEffect(() => {
    const shouldFetch = shopifyIds.length > 0 && !fetchedRef.current;
    if (shouldFetch) {
      fetchPrices();
      fetchedRef.current = true; // Set the ref after fetching
    }
  }, [fetchPrices, shopifyIds, props.items]);
  // end localized product prices

  if (!items || items.length === 0) {
    return <></>; // Render nothing when there are no items
  }
  return (
    <div
      id="recommendations"
      className={`recommendations-carousel ${
        isRestingSearch ? 'min-h-[375px]' : ''
      }`}
    >
      <div
        className={`grid grid-cols-2 gap-1 ${
          isRestingSearch ? 'md:grid-cols-4' : 'md:grid-cols-2'
        }`}
      >
        {items.map((item: RecommendProduct, index: number) => (
          <div key={`${item.prod_code}`}>
            <BestSellerCard
              title={item.prod_name}
              data={item}
              loading={index < 8 ? 'eager' : 'lazy'}
              priceData={returnPriceData(Number(item.prod_code), priceData)}
              isRestingSearch={isRestingSearch}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
