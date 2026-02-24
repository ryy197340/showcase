import {Await, MetaFunction, useLoaderData} from '@remix-run/react';
import {stegaClean} from '@sanity/client/stega';
import {
  flattenConnection,
  getSelectedProductOptions,
  type SeoConfig,
  type SeoHandleFunction,
  ShopifyAnalyticsProduct,
} from '@shopify/hydrogen';
import type {
  MediaConnection,
  MediaImage,
  Product,
} from '@shopify/hydrogen/storefront-api-types';
import {Shop} from '@shopify/hydrogen/storefront-api-types';
import {AnalyticsPageType} from '@shopify/hydrogen-react';
import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {RecommendGetResultsReturn, RecommendProduct} from '@xgenai/sdk-core';
import clsx from 'clsx';
import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import React from 'react';
import {useLocation} from 'react-router-dom'; //PEAK ACTIVITY ADDITION
import invariant from 'tiny-invariant';

import Breadcrumb from '~/components/elements/BreadCrumb';
import ModuleGrid from '~/components/modules/ModuleGrid';
import AMessageFromJMCL from '~/components/product/AMessageFromJMCL';
import BvGallery from '~/components/product/BazaarVoiceGallery';
import ProductDetails from '~/components/product/Details';
import RequestACatalog from '~/components/product/RequestACatalog';
import BestSellers from '~/components/product/YMALBestSellers';
import {useXgenClient} from '~/contexts/XgenClientContext';
import {useHydration} from '~/hooks/useHydration';
import type {SanityProductPage} from '~/lib/sanity';
import {returnPdpSchema} from '~/lib/schema';
import {ColorTheme} from '~/lib/theme';
import {fetchGids, GlobalContext, notFound, validateLocale} from '~/lib/utils';
import {SHOP_QUERY} from '~/lib/utils';
import {SANITY_XGEN_PODS_MAP} from '~/lib/xgen/constants';
import {
  XGenRecommendationResult,
  XGenRecommendationResultItem,
} from '~/lib/xgen/types';
import {transformXGenArrayToCio} from '~/lib/xgen/utils/transformProduct';
import {PRODUCT_PAGE_QUERY} from '~/queries/sanity/product';
import {PRODUCT_QUERY} from '~/queries/shopify/product';
import {CompleteTheLookData, ProductRouteProduct} from '~/types/shopify';
import {stripGlobalId} from '~/utils';
import {pushViewItemNew} from '~/utils/gtmEvents'; //PEAK ACTIVITY ADDITION
import {fetchAptosQtyBulk} from '~/utils/product';

const RECOMMENDATION_PODS = [
  SANITY_XGEN_PODS_MAP['product-detail-page-2'],
  SANITY_XGEN_PODS_MAP['product-detail-page-3'],
  SANITY_XGEN_PODS_MAP['product-detail-page-4'],
  SANITY_XGEN_PODS_MAP['product-detail-page-1'], // Pair With
];

const seo: SeoHandleFunction = ({data}) => {
  const media = flattenConnection<MediaConnection>(data.product?.media).find(
    (media) => media.mediaContentType === 'IMAGE',
  ) as MediaImage | undefined;
  const maxLength = 150; // Maximum length for the description
  // Get the original description
  const originalDescription =
    data?.page?.seo?.description ??
    data?.product?.seo?.description ??
    data?.product?.description ??
    '';

  // Truncate the description if it exceeds the maximum length
  const truncatedDescription =
    originalDescription.length > maxLength
      ? originalDescription.substring(0, maxLength) + '...'
      : originalDescription;

  const params = new URLSearchParams();

  if (data?.selectedVariant?.selectedOptions) {
    data.selectedVariant.selectedOptions.forEach(
      (option: {name: string; value: string}) => {
        params.set(option.name, option.value);
      },
    );
  }
  const title =
    data?.page?.seo?.title ?? data?.product?.seo?.title ?? data?.product?.title;
  const imageUrl = data?.page?.seo?.image?.url ?? media?.image?.url;
  return {
    title,
    media: data?.page?.seo?.image ?? media?.image,
    description: truncatedDescription,
    jsonLd: returnPdpSchema(
      title,
      imageUrl,
      truncatedDescription,
      data?.product?.parentSku?.value,
      `${data?.origin}/products/${data?.product?.handle}`,
      data?.selectedVariant?.price?.amount,
      data?.selectedVariant?.price?.currencyCode,
      data?.selectedVariant?.quantityAvailable,
    ),
  } satisfies SeoConfig<Product>;
};

export const handle = {
  seo,
};

export const meta: MetaFunction = ({data}) => {
  return [
    {
      property: 'og:image',
      content: `${data?.product?.media?.nodes[0].image.url}`,
    },
    {
      property: 'twitter:image',
      content: `${data?.product?.media?.nodes[0].image.url}`,
    },
  ];
};

export async function loader({params, context, request}: LoaderFunctionArgs) {
  validateLocale({context, params});
  const {handle} = params;
  invariant(handle, 'Missing handle param, check route filename');
  const selectedOptions = getSelectedProductOptions(request);
  const aptosQtyThreshold = context.env.APTOS_QTY_THRESHOLD ?? 1;
  const aptosQtyThresholdInt =
    typeof aptosQtyThreshold === 'number'
      ? aptosQtyThreshold
      : parseInt(aptosQtyThreshold, 10);

  let page;
  let product;
  let shop;
  try {
    [page, {product}, shop] = await Promise.all([
      context.sanity
        .loadQuery<SanityProductPage>(
          PRODUCT_PAGE_QUERY,
          {handle},
          {
            hydrogen: {
              tag: 'product-page',
            },
          },
        )
        .then(({data}) => data),
      context.storefront.query<{
        product: ProductRouteProduct;
      }>(PRODUCT_QUERY, {
        variables: {
          handle,
          selectedOptions,
        },
      }),
      context.storefront.query<{
        shop: Shop;
      }>(SHOP_QUERY),
    ]);
  } catch (error) {
    console.error('Error:', error);
  }

  const {origin} = new URL(request.url);
  if (!page || !product?.id) {
    throw notFound();
  }

  // Resolve any references to products on the Storefront API
  // TODO: remove gids? Doesn't seem to be in use
  const gids = fetchGids({page, context});
  const firstVariant = product.variants.nodes[0];
  const firstAvailableVariant =
    product.variants.nodes.find(
      (variant) =>
        variant.availableForSale &&
        variant.quantityAvailable &&
        variant.quantityAvailable > aptosQtyThresholdInt,
    ) ?? firstVariant;
  const selectedVariant = product.selectedVariant ?? firstAvailableVariant;

  // fetch aptosQty for all of the variants in the product, so that we have them on variant change
  const skus: any[] = [];
  product.variants.nodes.forEach((variant) => skus.push(variant?.sku));
  const aptosQuantityArray = await fetchAptosQtyBulk(
    skus,
    context.env,
    context,
  );

  product.variants.nodes.forEach((variant) => {
    variant.aptosQty = aptosQuantityArray.find(
      (inventory) => inventory.sku == variant.sku,
    )?.aptosInventory;
  });

  const productAnalytics: ShopifyAnalyticsProduct = {
    productGid: product?.id,
    variantGid: selectedVariant?.id,
    name: product?.title,
    variantName: selectedVariant?.title,
    brand: product?.vendor,
    price: selectedVariant?.price?.amount,
    sku: selectedVariant?.sku,
  };

  const products = [];

  // ✅ Handle nested Complete The Look modules
  const completeTheLookRowModules = page.modules?.filter(
    (module) => module._type === 'module.completeTheLookRow',
  );

  if (completeTheLookRowModules?.length) {
    try {
      for (const rowModule of completeTheLookRowModules) {
        if (!rowModule.content?.length) continue;

        for (const lookModule of rowModule.content) {
          if (!lookModule.product?.length) continue;

          const products = await Promise.all(
            lookModule.product.map(async (productRef) => {
              const query = `*[_type == "product" && _id == "${productRef._ref}"][0]`;
              const {data: productData} = await context.sanity.loadQuery(
                query,
                undefined,
                {
                  hydrogen: {
                    tag: 'product',
                  },
                },
              );
              return productData;
            }),
          );

          // ✅ Safe: scoped to *this* completeTheLook module
          lookModule.products = products;
        }
      }
    } catch (error) {
      console.error('Error resolving completeTheLookRow products', error);
    }
  }

  return defer({
    shop,
    page,
    product,
    gids,
    selectedVariant,
    analytics: {
      pageType: AnalyticsPageType.product,
      resourceId: product.id,
      products: [productAnalytics],
      totalValue: parseFloat(selectedVariant.price.amount),
    },
    origin,
    products,
  });
}

// context provider for pod data
type PodDataContextType = {
  children: React.ReactNode;
  itemId: string;
  ready: boolean;
  onLoadCallback?: () => void;
};
export const PodDataContext = createContext({} as any);
export const PodDataProvider = ({
  children,
  itemId,
  ready,
  onLoadCallback,
}: PodDataContextType) => {
  const xgenClient = useXgenClient();

  const [completeTheLookData, setCompleteTheLookData] =
    useState<XGenRecommendationResultItem | null>(null);
  const [recommendationsData, setRecommendationsData] =
    useState<XGenRecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {shop} = useLoaderData<typeof loader>();

  useEffect(() => {
    async function fetchData() {
      if (!xgenClient || !ready) return;

      setIsLoading(true);
      setError(null);

      try {
        const recommendData: XGenRecommendationResult =
          await xgenClient.recommend.getResults({
            elementIds: RECOMMENDATION_PODS.map((pod) => pod.id),
            options: {
              context: {
                pdpCode: itemId,
              },
            },
          });

        RECOMMENDATION_PODS.forEach((pod) => {
          recommendData[pod.id].id = pod.id;
          recommendData[pod.id].normalizedItems = transformXGenArrayToCio(
            recommendData[pod.id].items,
          );
        });

        const completeTheLookData: XGenRecommendationResultItem = {
          id: SANITY_XGEN_PODS_MAP['product-detail-page-1'].id,
          ...recommendData[SANITY_XGEN_PODS_MAP['product-detail-page-1'].id],
        };
        setCompleteTheLookData(completeTheLookData);

        delete recommendData[SANITY_XGEN_PODS_MAP['product-detail-page-1'].id];
        setRecommendationsData(recommendData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('There was a problem fetching data');
      } finally {
        setIsLoading(false);
        onLoadCallback?.();
      }
    }

    fetchData();
  }, [itemId, xgenClient, ready, onLoadCallback]);

  const podDataContextValues = useMemo(
    () => ({
      itemId,
      completeTheLookData,
      recommendationsData,
      shop,
      isLoading,
      error,
    }),
    [itemId, completeTheLookData, error, isLoading, recommendationsData, shop],
  );

  return (
    <PodDataContext.Provider value={podDataContextValues}>
      {children}
    </PodDataContext.Provider>
  );
};

export default function ProductHandle() {
  const {eventTrackingData} = useContext(GlobalContext);
  const {page, product, selectedVariant, analytics, gids} =
    useLoaderData<typeof loader>();
  const location = useLocation();
  const [pageViewFired, setPageViewFired] = useState<boolean>(false);
  const pdpGlobalModules = [
    page.pdpMessageFromJMCL,
    page.pdpRequestACatalog,
    page.pdpFinalSale,
  ];
  const {pdpMessageFromJMCL, pdpRequestACatalog} = page;
  const xgenClient = useXgenClient();
  const isHydrated = useHydration();

  useEffect(() => {
    if (product && selectedVariant) {
      const reshapeProduct = product;
      reshapeProduct.selectedVariant = selectedVariant;
      pushViewItemNew(
        reshapeProduct,
        eventTrackingData.customer,
        eventTrackingData.currency,
      );
      //PEAK ACTIVITY ADDITIONS ENDS
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    location.pathname,
    location.search,
    product,
    selectedVariant,
    eventTrackingData.customer,
  ]); //PEAK ACTIVITY EDITS

  useEffect(() => {
    if (!xgenClient || !product || !selectedVariant || pageViewFired) {
      return;
    }

    const reshapeProduct = product;
    reshapeProduct.selectedVariant = selectedVariant;
    window.debouncedPushViewItemXgen(
      xgenClient,
      reshapeProduct,
      eventTrackingData.customer,
      eventTrackingData.currency,
      () => setPageViewFired(true),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xgenClient, product.id, selectedVariant.id]);
  /*
  const { customer } = useContext(GlobalContext) || {};
  useEffect(() => {
    if (customer && product) {
      pushViewItemNew(product, customer, "USD");
    }
}, [location.pathname, location.search, product, customer]);
*/

  const strippedId = stripGlobalId(product.id);

  return (
    <PodDataProvider
      itemId={stripGlobalId(product.id)}
      ready={pageViewFired}
      onLoadCallback={() => setPageViewFired(false)}
    >
      <ColorTheme value={page.colorTheme}>
        <div className="page-width relative w-full">
          <Suspense
            fallback={
              <ProductDetails
                selectedVariant={selectedVariant}
                sanityProduct={page}
                storefrontProduct={product}
                storefrontVariants={[]}
                analytics={analytics}
                pdpGlobalModules={pdpGlobalModules}
              />
            }
          >
            <Await
              errorElement="There was a problem loading related products"
              resolve={product.variants}
            >
              {() => (
                <div className="px-5 lg:px-10">
                  <Breadcrumb storefrontProduct={product} />
                  <ProductDetails
                    selectedVariant={selectedVariant}
                    sanityProduct={page}
                    storefrontProduct={product}
                    storefrontVariants={product.variants.nodes || []}
                    analytics={analytics}
                    pdpGlobalModules={pdpGlobalModules}
                    bazaarVoiceUGC={page.bazaarVoiceUGC}
                    bazaarVoiceUGCPlacement={page.bazaarVoiceUGCPlacement}
                    strippedId={strippedId}
                  />
                </div>
              )}
            </Await>
          </Suspense>
        </div>
        <div className="clear-both w-full">
          <Suspense>
            <Await
              errorElement="There was a problem loading page elements"
              resolve={page}
            >
              {page?.modules && (
                <div
                  className={clsx(
                    'w-full py-2',
                    !(page.modules as any[]).some(
                      (module: any) =>
                        module._type === 'module.completeTheLookRow' &&
                        module.content?.some(
                          (look: any) => look.variant === 'variant 2',
                        ),
                    ) && 'overflow-hidden',
                  )}
                >
                  <ModuleGrid items={page.modules} />
                </div>
              )}
              {pdpMessageFromJMCL?.show === true && (
                <AMessageFromJMCL pdpMessageFromJMCL={pdpMessageFromJMCL} />
              )}
            </Await>
          </Suspense>
        </div>

        {/* YMAL */}
        <Suspense>
          <Await
            errorElement="There was a problem loading related products"
            resolve={product}
          >
            <div className="page-width px-5 md:px-0">
              <BestSellers />
            </div>
          </Await>
        </Suspense>

        {/* Request a Catalog */}
        <Suspense>
          <Await
            errorElement="There was a problem loading page elements"
            resolve={page}
          >
            {pdpRequestACatalog?.show === true && (
              <RequestACatalog pdpRequestACatalog={pdpRequestACatalog} />
            )}
          </Await>
        </Suspense>
        {/* bazaar voice ugc gallery if full-width */}
        {page.bazaarVoiceUGC === true &&
          stegaClean(page.bazaarVoiceUGCPlacement) === 'full-width' && (
            <div className="page-width mb-5 mt-16 px-5 md:px-0">
              <BvGallery productId={stripGlobalId(product.id)} />
            </div>
          )}

        {/* BazaarVoice "Reviews" */}
        <div className="page-width px-5 md:px-8">
          <div
            data-bv-show="reviews"
            data-bv-product-id={stripGlobalId(product.id)}
          />
          <div
            data-bv-show="questions"
            data-bv-product-id={stripGlobalId(product.id)}
          />
        </div>

        {/* SSR */}
        {!isHydrated && (
          <>
            <h2>You May Also Like</h2>
            <h2>Privacy Preference Center</h2>
          </>
        )}
      </ColorTheme>
    </PodDataProvider>
  );
}
