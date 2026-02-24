import {useLoaderData, useLocation, useSearchParams} from '@remix-run/react';
import {useCallback, useContext, useEffect, useRef, useState} from 'react';

import {useXgenClient} from '~/contexts/XgenClientContext';
import {useHydration} from '~/hooks/useHydration';
import {ExtendedProduct} from '~/lib/shopify/types';
import {GlobalContext} from '~/lib/utils';
import {CollectionFiltersContext} from '~/routes/($lang).collections.$handle';
import {extractPageAndPerPageFromUrl} from '~/utils';
import {DEFAULT_PRODUCT_GRID_NUMBER, loadStatuses} from '~/utils/constants';
import {normalizeAllFacets} from '~/utils/normalizeFacets';

import Results from './Results';

// TODO: can this component be combined with <CioSearchResults>??
type Props = {
  products: ExtendedProduct[];
  setProducts: (products: ExtendedProduct[]) => void;
  altGrid?: any;
};

export default function CioBrowse({products, setProducts, altGrid}: Props) {
  const {
    items,
    resultsPerPage,
    resultsPage,
    setFacets,
    setGroups,
    setItems,
    setSortOptions,
    setTotalResults,
    totalResults,
    slottedContent,
    facetFilters,
    sortParams,
  } = useContext(CollectionFiltersContext);
  const {xgenConfig} = useContext(GlobalContext);
  const {collection, xgSearchResponse} = useLoaderData<any>();
  const location = useLocation();

  const match = location.pathname.match(/\/collections\/(.+)/);

  const collectionName = match ? match[1].replaceAll('/', '').trim() : 'all';
  const [loadStatus, setLoadStatus] = useState(loadStatuses.STALE);
  const [error, setError] = useState();
  const [params] = useSearchParams();
  const initialResultsPerPage = params.get('per_page');
  const xgenClient = useXgenClient();
  const previousUrlRef = useRef('');
  const cacheRef = useRef<
    Map<string, {items: any[]; facets: any[]; totalResults: number}>
  >(new Map());
  const isHydrated = useHydration();
  const hasInitialData = useRef(false);

  // Track if we have server-rendered data to prevent unnecessary fetches
  useEffect(() => {
    if (items?.length > 0 && !hasInitialData.current) {
      hasInitialData.current = true;
      const currentUrl = location.pathname + location.search;
      previousUrlRef.current = currentUrl;
      // Cache the initial server data
      const normalizedFacets = xgSearchResponse?.facets?.[0]?.facets
        ? normalizeAllFacets(xgSearchResponse.facets[0].facets) || []
        : [];
      cacheRef.current.set(currentUrl, {
        items,
        facets: normalizedFacets,
        totalResults,
      });
    }
  }, [
    items,
    location.pathname,
    location.search,
    totalResults,
    xgSearchResponse,
  ]);

  // Function to fetch browse results from API
  const fetchBrowseResultsFromAPI = useCallback(async () => {
    setLoadStatus(loadStatuses.LOADING);
    try {
      const {page, perPage} = extractPageAndPerPageFromUrl(location.search);

      const query = collectionName?.split('-').join(' ') ?? '';
      const effectivePerPage =
        perPage !== DEFAULT_PRODUCT_GRID_NUMBER
          ? perPage
          : altGrid.altGrid
          ? DEFAULT_PRODUCT_GRID_NUMBER + 2
          : DEFAULT_PRODUCT_GRID_NUMBER;

      const response = await xgenClient?.search.getResults({
        query,
        options: {
          collection: 'default',
          page: page - 1,
          pageSize: effectivePerPage,
          facets: 'v2',
          ...sortParams,
          context: {
            collection: [collectionName],
            ...facetFilters,
          },
          // Use collection-specific deploymentId if available, otherwise use default
          deploymentId:
            collection.xgenCollectionDeploymentId?.value ??
            xgenConfig.plpDeploymentId,
        },
      });
      const normalizedFacets =
        // @ts-expect-error - base facet type is not defined
        normalizeAllFacets(response?.facets?.[0]?.facets) || [];
      const cacheKey = location.pathname + location.search;
      cacheRef.current.set(cacheKey, {
        items: response?.items || [],
        facets: normalizedFacets,
        totalResults: response?.totalResults || 0,
      });
      setItems(response?.items);
      setFacets(normalizedFacets);
      setTotalResults(response?.totalResults);
      setLoadStatus(loadStatuses.SUCCESS);
    } catch (e: any) {
      setLoadStatus(loadStatuses.FAILED);
      setError(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    xgenClient,
    collectionName,
    initialResultsPerPage,
    facetFilters,
    location.search,
    location.pathname,
  ]);

  useEffect(() => {
    // Don't do anything until hydrated to prevent server/client mismatch
    if (!isHydrated) {
      return;
    }

    const currentUrl = location.pathname + location.search;
    // If this is the same URL, don't do anything
    if (previousUrlRef.current === currentUrl) {
      return;
    }

    // Check cache first
    const cached = cacheRef.current.get(currentUrl);
    if (cached) {
      setItems(cached.items);
      setFacets(cached.facets);
      setTotalResults(cached.totalResults);
      setLoadStatus(loadStatuses.SUCCESS);
      previousUrlRef.current = currentUrl;
      return;
    }

    // Only fetch if we've actually navigated away from initial data
    // Don't fetch on first hydration if we already have server data
    const shouldFetch = hasInitialData.current && previousUrlRef.current !== '';

    if (shouldFetch) {
      previousUrlRef.current = currentUrl;
      fetchBrowseResultsFromAPI();
    } else {
      // Just update the URL reference without fetching
      previousUrlRef.current = currentUrl;
    }
  }, [
    isHydrated,
    location.search,
    location.pathname,
    fetchBrowseResultsFromAPI,
    setFacets,
    setItems,
    setTotalResults,
  ]);
  return (
    <Results
      altGrid={altGrid}
      items={items}
      products={products}
      setProducts={setProducts}
      loadStatus={loadStatus}
      error={error}
      dataAttributes={{
        'data-cnstrc-browse': true,
        'data-cnstrc-filter-name': 'group_id',
        'data-cnstrc-filter-value': collectionName,
        'data-cnstrc-num-results': totalResults,
      }}
    />
  );
}
