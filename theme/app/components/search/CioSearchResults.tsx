import type {Product} from '@shopify/hydrogen/storefront-api-types';
import {useContext, useState} from 'react';

import {SearchFiltersContext} from '~/routes/($lang).search';
import {loadStatuses} from '~/utils/constants';

import Results from '../collection/Results';

// TODO: can this component be combined with <CioBrowse>??
type Props = {
  products: Product[];
  setProducts: (products: Product[]) => void;
  resultId?: string;
};
export default function CioSearchResults({
  products,
  setProducts,
  resultId,
}: Props) {
  const {items, totalResults} = useContext(SearchFiltersContext);
  const [loadStatus, setLoadStatus] = useState(loadStatuses.STALE);
  const [error, setError] = useState();

  return (
    <Results
      items={items}
      products={products}
      setProducts={setProducts}
      loadStatus={loadStatus}
      error={error}
      dataAttributes={{
        'data-cnstrc-search': true,
        'data-cnstrc-num-results': totalResults,
        'data-cnstrc-result-id': resultId,
      }}
    />
  );
}
