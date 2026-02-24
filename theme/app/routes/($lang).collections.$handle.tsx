import {useLoaderData} from '@remix-run/react';
import {useLocation, useNavigate, useSearchParams} from '@remix-run/react';
import {AnalyticsPageType, type SeoHandleFunction} from '@shopify/hydrogen';
import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {type SearchGetResultsReturn} from '@xgenai/sdk-core';
import clsx from 'clsx';
import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import invariant from 'tiny-invariant';

import CioBrowse from '~/components/collection/Browse';
import {SORT_OPTIONS} from '~/components/collection/SortOrder';
import WPromoteContent from '~/components/collection/WPromoteContent';
import YouMayAlsoLike from '~/components/collection/YouMayAlsoLike';
import CategoryNav from '~/components/filters/CategoryNav';
import FacetFilters from '~/components/filters/FacetFilters';
import FilterBreadcrumbs from '~/components/filters/FilterBreadcrumbs';
import MobileSortOptions from '~/components/filters/MobileSortOptions';
import ResultsPagination from '~/components/filters/ResultsPagination';
import ResultsPerPageSelector from '~/components/filters/ResultsPerPageSelector';
import SortOptions from '~/components/filters/SortOptions';
import CollectionHero from '~/components/heroes/Collection';
import CloseIcon from '~/components/icons/Close';
import {FacetCaret} from '~/components/icons/FacetCaret';
import {ViewOptionSelectorDouble} from '~/components/icons/ViewOptionSelectorDouble';
import {ViewOptionSelectorSingle} from '~/components/icons/ViewOptionSelectorSingle';
import {Link as HydrogenLink} from '~/components/Link';
import ModuleGrid from '~/components/modules/ModuleGrid';
import {DEFAULT_SORTING} from '~/constants/defaultSorting';
import {useXgenClient} from '~/contexts/XgenClientContext';
import {useHydration} from '~/hooks/useHydration';
import useTrackElementInteractions from '~/hooks/useTrackElementInteractions';
import {Group} from '~/lib/constructor/types';
import type {
  SanityCollectionPage,
  SanityCollectionPageModules,
} from '~/lib/sanity';
import {PLP_BREADCRUMB_SCHEMA} from '~/lib/schema';
import {SortParam} from '~/lib/shopify/types';
import {ColorTheme} from '~/lib/theme';
import {fetchGids, notFound, validateLocale} from '~/lib/utils';
import {GlobalContext} from '~/lib/utils';
import {
  COLLECTION_FALLBACK_QUERY,
  COLLECTION_PAGE_LOWER_MODULES_QUERY,
  COLLECTION_PAGE_MODULES_QUERY,
  COLLECTION_PAGE_QUERY,
} from '~/queries/sanity/collection';
import {
  ALL_COLLECTIONS_QUERY,
  COLLECTION_QUERY,
} from '~/queries/shopify/collection';
import {extractPageAndPerPageFromUrl, toPageNumber} from '~/utils';
import {
  groupCollectionsByParent,
  mapLinkedParentCollections,
  normalizeParentCollections,
} from '~/utils/bredcrumbUtils';
import {DEFAULT_PRODUCT_GRID_NUMBER} from '~/utils/constants';
import {pushViewItemListDataXgen} from '~/utils/eventTracking';
import {extractFiltersFromUrl} from '~/utils/extractFiltersFromUrl';
import {extractSortFromUrl, SortParams} from '~/utils/extractSortFromUrl';
import {pushViewItemListDataNew} from '~/utils/gtmEvents'; //PEAK ACTIVITY ADDITION
import {normalizeAllFacets} from '~/utils/normalizeFacets';
import {getSearchResults} from '~/utils/xgen';

const seo: SeoHandleFunction<typeof loader> = ({data}) => {
  const title =
    data?.page?.seo?.title ??
    data?.collection?.seo?.title ??
    data?.collection?.title;
  return {
    title,
    description:
      data?.page?.seo?.description ??
      data?.collection?.seo?.description ??
      data?.collection?.description,
    media: data?.page?.seo?.image ?? data?.collection?.image,
    jsonLd: PLP_BREADCRUMB_SCHEMA(data?.page?.slug, title),
  };
};

export const handle = {
  seo,
};

export const PAGINATION_SIZE = 100;
export const EXCLUDED_CATEGORIES = ['New Arrivals', 'Default Category'];

export async function loader({params, context, request}: LoaderFunctionArgs) {
  validateLocale({context, params});

  const {handle} = params;
  const searchParams = new URL(request.url).searchParams;
  const {sortKey, reverse} = getSortValuesFromParam(
    searchParams.get('sort') as SortParam,
  );
  const cursor = searchParams.get('cursor');
  const count = searchParams.get('count');
  invariant(params.handle, 'Missing collection handle');
  const facetFilters = extractFiltersFromUrl(searchParams);
  const sortParams = extractSortFromUrl(searchParams);
  const cache = context.storefront.CacheCustom({
    mode: 'public',
    maxAge: 60,
    staleWhileRevalidate: 60,
  });

  // Fetch the collection page and products from the Storefront API
  let page,
    pageModules,
    pageLowerModules,
    collection,
    fallbackContent,
    xgSearchResponse,
    allCollections;

  try {
    const query = handle?.split('-').join(' ') ?? '';
    [
      page,
      pageModules,
      pageLowerModules,
      {collection},
      fallbackContent,
      allCollections,
    ] = await Promise.all([
      context.sanity
        .loadQuery<SanityCollectionPage>(
          COLLECTION_PAGE_QUERY,
          {
            slug: params.handle,
          },
          {hydrogen: {cache}},
        )
        .then(({data}) => data),
      context.sanity
        .loadQuery<SanityCollectionPageModules>(
          COLLECTION_PAGE_MODULES_QUERY,
          {slug: params.handle},
          {hydrogen: {cache}},
        )
        .then(({data}) => data),
      context.sanity
        .loadQuery<SanityCollectionPageModules>(
          COLLECTION_PAGE_LOWER_MODULES_QUERY,
          {slug: params.handle},
          {hydrogen: {cache}},
        )
        .then(({data}) => data),
      context.storefront.query<{collection: any}>(COLLECTION_QUERY, {
        variables: {
          handle,
          cursor,
          sortKey,
          reverse,
          count: count ? parseInt(count) : PAGINATION_SIZE,
        },
      }),
      context.sanity
        .loadQuery(COLLECTION_FALLBACK_QUERY, undefined, {
          hydrogen: {cache},
          tag: 'collection-fallback',
        })
        .then(({data}) => data)
        .catch(() => null),
      context.storefront
        .query(ALL_COLLECTIONS_QUERY, {
          variables: {first: 250},
        })
        .catch(() => null),
    ]);

    const collectionDeploymentId = collection.xgenCollectionDeploymentId?.value;
    const fallbackDeploymentId = context.env.XGEN_PLP_DEPLOYMENT_ID!;
    const {page: pageNum, perPage} = extractPageAndPerPageFromUrl(request.url);
    //Determine effective page size
    const effectivePerPage =
      perPage !== DEFAULT_PRODUCT_GRID_NUMBER
        ? perPage
        : page?.altGridObject?.altGrid
        ? DEFAULT_PRODUCT_GRID_NUMBER + 2 // altGrid adjustment
        : DEFAULT_PRODUCT_GRID_NUMBER;

    xgSearchResponse = await getSearchResults(context, {
      query,
      options: {
        collection: 'default',
        page: pageNum - 1, // XGen page numbers are 0-indexed so we need to subtract 1
        pageSize: effectivePerPage,
        ...sortParams,
        facets: 'v2',
        context: {
          collection: [handle ?? 'all'],
          ...facetFilters,
        },
        deploymentId: collectionDeploymentId ?? fallbackDeploymentId,
      },
    });

    // If there's no product results, CMS content will be used instead
  } catch (error) {
    console.error('Error fetching collection:', error);
    throw notFound();
  }
  // Handle 404s
  if (!page || !collection) {
    throw notFound();
  }
  if (page && pageModules && pageLowerModules) {
    page = {...page, ...pageModules, ...pageLowerModules};
  }

  // Resolve any references to products on the Storefront API
  const gids = fetchGids({page, context});

  return {
    page,
    collection,
    gids,
    xgSearchResponse,
    sortKey,
    analytics: {
      pageType: AnalyticsPageType.collection,
      handle,
      resourceId: collection.id,
    },
    fallbackContent,
    facetFilters,
    sortParams,
    allCollections,
    hasXgDeploymentId: !!collection.xgenCollectionDeploymentId?.value,
  };
}

export const CollectionFiltersContext = createContext<any>({});

/**
 * During SSR for PLP we need to render the breadcrumbs and title for SEO purposes.
 * The component is hidden by default and will not be rendered during CSR.
 */
const SSRFallback = ({
  collection,
  page,
  allCollections,
}: {
  collection: any;
  page: SanityCollectionPage;
  allCollections: any;
}) => {
  const title = page?.seo?.title ?? collection?.seo?.title ?? collection?.title;
  const h1 = collection.displayTitle
    ? collection.displayTitle.value
    : page.customPageTitle
    ? page.customPageTitle
    : page.title;

  const ssrBreadcrumbs = {
    handle: page?.slug,
    title,
  };
  const displayCategory =
    collection.displayableCategory?.value ?? collection.title;
  const currentCollectionPath = [
    'All',
    ...displayCategory
      .split('/')
      .map((item: string) => item.trim())
      .filter((item) => item && !EXCLUDED_CATEGORIES.includes(item)),
  ];

  const breadcrumbGroups = groupCollectionsByParent(
    allCollections,
    collection,
    currentCollectionPath,
  );

  return (
    <div className="hidden h-0 w-0">
      <nav aria-label="breadcrumb">
        <ol>
          <li>
            <a href="https://www.jmclaughlin.com/">Home</a>
          </li>
          <li>
            <a
              href={`https://www.jmclaughlin.com/collections/${ssrBreadcrumbs.handle}`}
            >
              {title}
            </a>
          </li>
        </ol>
      </nav>
      {breadcrumbGroups?.[0]?.children?.map((group) => {
        return (
          <HydrogenLink
            to={`/collections/${group.group_id}`}
            key={group.group_id}
          >
            {group.display_name}
          </HydrogenLink>
        );
      })}
    </div>
  );
};

function CollectionCSR() {
  const {
    collection,
    page,
    gids,
    xgSearchResponse,
    fallbackContent,
    facetFilters,
    sortParams,
    allCollections,
    hasXgDeploymentId,
  } = useLoaderData<typeof loader>() as unknown as {
    collection: any;
    page: SanityCollectionPage;
    pageModules: SanityCollectionPageModules;
    gids: any;
    xgSearchResponse: SearchGetResultsReturn;
    fallbackContent: any;
    facetFilters: Record<string, string[]>;
    sortParams: SortParams;
    allCollections: any;
    hasXgDeploymentId: boolean;
  };
  const {xgenConfig} = useContext(GlobalContext);

  const xgenClient = useXgenClient();

  const isHydrated = useHydration();
  const location = useLocation();
  // Initialize state from URL parameters to prevent hydration mismatches
  const {page: urlPage, perPage: urlPerPage} = extractPageAndPerPageFromUrl(
    location.search,
  );

  const [products, setProducts] = useState(collection?.products?.nodes);
  const [facetsMenuIsOpen, setFacetsMenuIsOpen] = useState(false);
  const [mobileSortOptionIsOpen, setMobileSortOptionIsOpen] = useState(false);
  const [items, setItems] = useState(xgSearchResponse?.items || []);
  const [resultsPage, setResultsPage] = useState(urlPage || 1);
  const [resultsPerPage, setResultsPerPage] = useState(
    urlPerPage || DEFAULT_PRODUCT_GRID_NUMBER,
  );
  const [totalResults, setTotalResults] = useState(
    xgSearchResponse?.totalResults || 0,
  );

  useEffect(() => {
    setTotalResults(xgSearchResponse?.totalResults || 0);
  }, [xgSearchResponse]);

  const [breadcrumbGroups, setBreadcrumbGroups] = useState([]);
  const [siblingBreadcrumbItems, setSiblingBreadcrumbItems] = useState();
  const [breadcrumbParentCollections, setBreadcrumbParentCollections] =
    useState();
  // Set Facets
  const [facets, setFacets] = useState(
    // @ts-expect-error - base facet type is not defined
    normalizeAllFacets(xgSearchResponse?.facets?.[0]?.facets) || [],
  );
  // Set Groups
  const [groups, setGroups] = useState([]);
  // Set Sort Options
  const [sortOptions, setSortOptions] = useState(() =>
    (DEFAULT_SORTING || []).map((item: any) => ({
      ...item,
      id: `${item.sort_by}_${item.sort_order}`,
    })),
  );
  // Set View
  const [view, setView] = useState(0);
  const [activeOption, setActiveOption] = useState('small');

  //This is causing too many requests in the /api/product/{handle}. I am wondering if we can trigger a site refresh when the locale change.
  // useEffect(() => {
  //   // this is required to re-render the product grid on PLP after locale change
  //   setProducts(collection.products.nodes);
  // }, [collection]);

  // constructor states
  const {eventTrackingData} = useContext(GlobalContext);

  const collectionFiltersContextValues = useMemo(
    () => ({
      groups,
      view,
      items,
      resultsPage,
      resultsPerPage,
      setGroups,
      setFacets,
      setItems,
      setView,
      setResultsPage,
      setSortOptions,
      setTotalResults,
      slottedContent: page.slottedContent,
      totalResults,
      facetFilters,
      sortParams,
    }),
    [
      groups,
      view,
      items,
      resultsPage,
      resultsPerPage,
      setItems,
      setFacets,
      setView,
      setGroups,
      setSortOptions,
      page.slottedContent,
      totalResults,
      facetFilters,
      sortParams,
    ],
  );

  const toggleBigImages = () => {
    setActiveOption('big');
    setView(1);
  };

  const toggleSmallImages = () => {
    setActiveOption('small');
    setView(2);
  };

  const toggleFacetsMenu = () => {
    setFacetsMenuIsOpen(!facetsMenuIsOpen);
  };

  const toggleMobileSortOption = () => {
    setMobileSortOptionIsOpen(!mobileSortOptionIsOpen);
  };

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const wPromoteContent = collection.wPromoteMetaObject
    ? collection.wPromoteMetaObject.reference.fields.reduce(
        (
          acc: {[x: string]: any},
          field: {key: string | number; value: any},
        ) => {
          acc[field.key] = field.value;
          return acc;
        },
        {},
      )
    : null;

  useEffect(() => {
    const displayCategory =
      collection.displayableCategory?.value ?? collection.title;
    const currentCollectionPath = [
      'All',
      ...displayCategory
        .split('/')
        .map((item: string) => item.trim())
        .filter((item) => item && !EXCLUDED_CATEGORIES.includes(item)),
    ];

    const displayTitle = collection.displayTitle?.value ?? collection.title;
    const currentCollectionDisplayName = displayTitle;
    if (allCollections?.collections?.edges) {
      const collections = allCollections.collections.edges.map(
        (edge: any) => edge.node,
      );
      setSiblingBreadcrumbItems(collections);
    }
    const group = groupCollectionsByParent(
      allCollections,
      collection,
      currentCollectionPath,
    );
    const linkedParentCollections = mapLinkedParentCollections(
      collection,
      allCollections,
    );

    const normalizedParentCollections = normalizeParentCollections(
      linkedParentCollections,
      currentCollectionPath,
      EXCLUDED_CATEGORIES,
      currentCollectionDisplayName,
    );
    setBreadcrumbGroups(group);
    setBreadcrumbParentCollections(normalizedParentCollections);
  }, [location.pathname, location.search, allCollections, collection]);

  // Consolidated URL parameter handling with hydration check
  useEffect(() => {
    if (isHydrated) {
      const {page, perPage} = extractPageAndPerPageFromUrl(location.search);
      const validPage = !isNaN(page) ? page : 1;
      const validPerPage = perPage || DEFAULT_PRODUCT_GRID_NUMBER;
      setResultsPage(validPage);
      setResultsPerPage(validPerPage);
    }
  }, [isHydrated, location.search]);

  //PEAK ACTIVITY ADDITIONS STARTS
  //PEAK ACTIVITY AND ELEVAR COMBINED
  const [lastTrackedRoute, setLastTrackedRoute] = useState('');
  const [lastTrackedItemsHash, setLastTrackedItemsHash] = useState('');
  const [isEventLocked, setIsEventLocked] = useState(false);

  const generateItemsHash = (items: any[]) =>
    JSON.stringify(items.map((item) => item?.data?.id || item));

  useEffect(() => {
    const currentRoute = location.pathname + location.search;

    // Reset tracking for a new route
    if (currentRoute !== lastTrackedRoute) {
      setLastTrackedRoute('');
      setLastTrackedItemsHash('');
      setIsEventLocked(false); // Unlock event for a new route
    }

    const timer = setTimeout(() => {
      const currentItemsHash = generateItemsHash(items);

      if (
        items?.length > 0 &&
        collection &&
        !isEventLocked &&
        (currentRoute !== lastTrackedRoute ||
          currentItemsHash !== lastTrackedItemsHash)
      ) {
        setLastTrackedRoute(currentRoute);
        setLastTrackedItemsHash(currentItemsHash);
        setIsEventLocked(true); // Lock event after firing

        if (
          // eventTrackingData.customer &&
          eventTrackingData.currency &&
          items.length > 0 &&
          collection
        ) {
          pushViewItemListDataXgen(
            xgenClient, // XGEN client might be null.
            items,
            collection,
            eventTrackingData.currency,
          );
          pushViewItemListDataNew(
            items,
            eventTrackingData.customer,
            eventTrackingData.currency,
            collection,
          );
          // console.log(
          //   'view_item_list events pushed successfully for route:',
          //   currentRoute,
          // );
        } else {
          // console.warn(
          //   'Necessary data missing for view_item_list events, skipping push',
          // );
        }
      }
    }, 500); // Adjust delay as needed

    return () => clearTimeout(timer); // Clear timer on effect cleanup

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    location.pathname,
    location.search,
    items,
    eventTrackingData.customer,
    eventTrackingData.currency,
    collection,
  ]);

  // Unlock the event on route or data changes
  useEffect(() => {
    setIsEventLocked(false);
  }, [location.pathname, location.search, items]);

  const elementId =
    collection.xgenCollectionDeploymentId?.value || xgenConfig.deploymentId;
  const itemsCodes = items?.map((item) => item.prod_code) || [];

  const {ref} = useTrackElementInteractions({
    elementId,
    items: itemsCodes,
    resetKey: itemsCodes.join(','), // Reset when items change so new events are fired
    enabled: elementId.length > 0,
    threshold: 0,
    click: {
      once: false,
      extract: {selector: '[data-item]', attr: 'data-item'},
    },
  });

  // The remaining logic is used to determine if the products fallback should be shown.
  const shopifyProducts = products ?? [];
  const xgenProducts = items ?? [];

  // Check if there are no products by either source. For collections with an XGen deploymentId, we only care
  // about the XGen products. Otherwise, we need to check if both Shopify and XGen products are available.
  const hasNoProducts = hasXgDeploymentId
    ? xgenProducts.length === 0
    : shopifyProducts.length === 0 || xgenProducts.length === 0;

  // Check if all products are unavailable. Since we use XGen products to populate the results, we need to check
  // them against the Shopify products to see if they are available
  const isProductUnavailable = (product: any) =>
    product.availableForSale === false ||
    (product.totalInventory !== null && product.totalInventory <= 0);
  const isProductsUnavailable = xgenProducts.every((xgenProduct) => {
    const shopifyProduct = shopifyProducts.find(
      (shopifyProduct: any) =>
        shopifyProduct.id.split('/').pop() === xgenProduct.prod_code,
    );
    return shopifyProduct && isProductUnavailable(shopifyProduct);
  });

  // If no products are returned by either source, or all products are unavailable, show the fallback.
  const shouldShowProductsFallback = hasNoProducts || isProductsUnavailable;

  return (
    <ColorTheme value={page.colorTheme}>
      {!isHydrated && (
        <SSRFallback
          collection={collection}
          page={page}
          allCollections={allCollections}
        />
      )}
      {/* Hero */}
      <CollectionHero fallbackTitle={page.title} hero={page.hero} />

      {/* Breadcrumb Container / Category Nav Container / Decorative Page Title */}
      <div className="flex flex-col overflow-hidden md:overflow-auto md:pt-8">
        {/* Breadcrumbs */}
        {collection?.hideAllBreadcrumbs?.value === 'true' ? null : (
          <FilterBreadcrumbs
            collection={collection}
            groups={breadcrumbGroups}
            parentCollections={breadcrumbParentCollections}
          />
        )}

        {/* Category Nav - items */}
        <div
          className={`${
            collection?.hideAllBreadcrumbs?.value === 'true' ||
            !breadcrumbGroups.some((group: Group) => group.children.length > 0)
              ? 'min-h-0'
              : 'min-h-[50px] w-full'
          }`}
        >
          {collection?.hideAllBreadcrumbs?.value !== 'true' &&
          breadcrumbGroups.some((group: Group) => group.children.length > 0) ? (
            <CategoryNav
              collection={collection}
              groups={breadcrumbGroups}
              siblingItems={siblingBreadcrumbItems}
              parentCollections={breadcrumbParentCollections}
            />
          ) : null}
        </div>
        {/* {collection?.hideAllBreadcrumbs?.value ===
            'true' ? null : breadcrumbGroups.some(
                (group: Group) => group.children.length > 0,
              ) ? (
              <CategoryNav
                collection={collection}
                groups={breadcrumbGroups}
                siblingItems={siblingBreadcrumbItems}
                parentCollections={breadcrumbParentCollections}
              />
            ) : null} */}

        {/* Decorative Page Title */}
        <h1 className="flex justify-center text-center font-hoefler text-[20pt] md:text-[38px]">
          {collection.displayTitle
            ? collection.displayTitle.value
            : page.customPageTitle
            ? page.customPageTitle
            : page.title}
        </h1>
      </div>

      {/* No results */}
      {shouldShowProductsFallback &&
        (fallbackContent ? (
          <div className={clsx('plp-modules overflow-hidden pt-2')}>
            <ModuleGrid items={fallbackContent.modules} />
          </div>
        ) : (
          <div className="mt-16 text-center text-lg text-darkGray">
            No products.
          </div>
        ))}

      {page?.modules && (
        <div className={clsx('plp-modules overflow-hidden pt-2')}>
          <ModuleGrid items={page.modules} />
        </div>
      )}

      {/* Results Filters */}
      <div
        id="results-filters"
        className="relative ml-auto mr-auto w-full flex-col justify-between px-5 py-2 text-[12px] sm:flex"
      >
        <div className="flex justify-between lg:hidden">
          <button
            onClick={toggleFacetsMenu}
            className="flex flex-row items-center gap-2"
          >
            <span>Filter</span>
            {/* <FacetFiltersIcon /> */}
            <FacetCaret />
          </button>
          <div className="flex flex-row items-center gap-x-[20px]">
            {totalResults > 0 && (
              <span>
                {totalResults} {totalResults === 1 ? 'item' : 'items'}
              </span>
            )}
            <div className="flex flex-row items-center gap-x-[10px]">
              <button onClick={toggleBigImages} className="relative md:hidden">
                <span
                  className={
                    activeOption === 'big'
                      ? "after:absolute after:bottom-0 after:left-0 after:block after:h-[1px] after:w-[23px] after:border-t after:border-black after:content-['']"
                      : ''
                  }
                >
                  <ViewOptionSelectorSingle />
                </span>
              </button>
              <button
                onClick={toggleSmallImages}
                className="relative md:hidden"
              >
                <span
                  className={
                    activeOption === 'small'
                      ? "after:absolute after:bottom-0 after:left-0 after:block after:h-[1px] after:w-[23px] after:border-t after:border-black after:content-['']"
                      : ''
                  }
                >
                  <ViewOptionSelectorDouble />
                </span>
              </button>
            </div>
            <button
              aria-label="Sort"
              className="flex flex-row items-center gap-x-[10px]"
              type="button"
              onClick={toggleMobileSortOption}
            >
              Sort
              <FacetCaret />
            </button>
          </div>
        </div>
        {/* Sort Options */}
        <div
          className={`${
            mobileSortOptionIsOpen
              ? 'fixed left-0 top-0 z-[300] block h-screen w-full border-b-2 border-b-lightGray bg-white '
              : 'hidden'
          } lg:hidden`}
        >
          <MobileSortOptions
            sortOptions={sortOptions}
            mobileSortOptionIsOpen={mobileSortOptionIsOpen}
            toggleMobileSortOption={toggleMobileSortOption}
          />
        </div>
        <div
          className={`${
            facetsMenuIsOpen
              ? 'fixed left-0 top-0 z-[300] block h-screen w-full border-b-2 border-b-lightGray bg-white'
              : 'hidden'
          } lg:flex lg:justify-between`}
        >
          {!!facets?.length && (
            <>
              <div className="flex h-full flex-col lg:contents">
                <div className="relative mb-2 block flex-none border-b-2 border-b-lightGray px-4 py-6 lg:hidden">
                  <p className="text-center text-[16px] font-bold uppercase">
                    Filter
                  </p>
                  <button
                    onClick={toggleFacetsMenu}
                    className="absolute right-0 top-1/2 my-auto mr-[20px] -translate-y-1/2 transform opacity-75"
                  >
                    <CloseIcon />{' '}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto lg:contents">
                  <FacetFilters
                    facets={facets}
                    totalProducts={totalResults}
                    facetFilters={facetFilters}
                  />
                </div>
                <div
                  className={`${
                    facetsMenuIsOpen ? 'block' : 'hidden'
                  } flex-none border-t-2 border-t-lightGray bg-white px-4 pb-4 pt-6 text-center lg:hidden`}
                >
                  <p className="mb-4">
                    You can select several filters at once.
                  </p>
                  <button
                    className="min-h-[50px] w-full bg-secondary px-3 text-xs text-white placeholder-darkGray"
                    onClick={toggleFacetsMenu}
                    type="button"
                    aria-label="apply"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
          <div className="hidden lg:flex lg:flex-row">
            <div className="flex flex-row items-center gap-x-[10px] pl-[10px]">
              {totalResults > 0 && (
                <span>
                  {totalResults} {totalResults === 1 ? 'item' : 'items'}
                </span>
              )}
              <div className="flex flex-row gap-x-[10px]">
                <ResultsPerPageSelector
                  totalResults={totalResults}
                  currentResultsPerPage={resultsPerPage}
                  setResultsPerPage={setResultsPerPage}
                  altGrid={page.altGridObject?.altGrid}
                />
              </div>
              <SortOptions sortOptions={sortOptions} />
            </div>
          </div>
        </div>
      </div>
      <div className={clsx('mb-32 ml-auto mr-auto mt-3 max-w-full')}>
        <CollectionFiltersContext.Provider
          value={collectionFiltersContextValues}
        >
          {/* product grid */}
          <div ref={ref}>
            <CioBrowse
              products={products}
              setProducts={setProducts}
              altGrid={page.altGridObject}
            />
          </div>
          <ResultsPagination
            resultsPerPage={resultsPerPage}
            totalResults={totalResults}
            resultsPage={resultsPage}
            setResultsPage={setResultsPage}
            navigate={navigate}
            searchParams={searchParams}
          />
        </CollectionFiltersContext.Provider>

        {/* lower modules */}
        {page?.lowerModules && (
          <div className={clsx('plp-modules overflow-hidden px-5 pt-10')}>
            <ModuleGrid items={page.lowerModules} />
          </div>
        )}

        {wPromoteContent && (
          <WPromoteContent wPromoteContent={wPromoteContent} />
        )}

        <YouMayAlsoLike categoryId={collection.handle} />
      </div>
    </ColorTheme>
  );
}

function getSortValuesFromParam(sortParam: SortParam | null) {
  const productSort = SORT_OPTIONS.find((option) => option.key === sortParam);

  return (
    productSort || {
      sortKey: null,
      reverse: false,
    }
  );
}

export default function Collection(props: any) {
  return <CollectionCSR {...props} />;
}
