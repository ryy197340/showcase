import type {Product} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import {useContext, useEffect, useState} from 'react';
import {useRef} from 'react'; //Peak

import ProductGallery from '~/components/product/GalleryQuickView';
import ProductWidget from '~/components/product/WidgetCardPLP';
import {useXgenClient} from '~/contexts/XgenClientContext';
import {useEnv} from '~/hooks/useEnv';
import {CioResultData, VariationsMap} from '~/lib/constructor/types';
import {GlobalContext} from '~/lib/utils';
import type {ProductRouteProduct, ProductWithNodes} from '~/types/shopify';
import {stripGlobalId} from '~/utils';
import {pushViewItemXgen} from '~/utils/eventTracking';
import {pushQuickViewItemEvent} from '~/utils/gtmEvents'; //PEAK ACTIVITY ADDITION
import {generateCioFamilyTag} from '~/utils/product';

type Props = {
  // Collection PLP Quick View
  data?: CioResultData;
  products: Product[];
  setProducts: (products: Product[]) => void;
  title?: string;
  variationsMap?: VariationsMap;
  currentProductUrl?: string;
  shouldFetch?: boolean;
  setShouldFetch?: () => void;
  isPDPYMALCard?: boolean;
  selectedVariantId?: number;
};

// Helper function to select the best variant based on criteria
const selectBestVariant = (
  variants: any[],
  selectedVariantId?: number,
  aptosQtyThreshold?: number,
) => {
  // First try to find a variant matching the selectedVariantId
  let selectedVariant = variants?.find((variant: any) => {
    const idParts = variant.id?.split('ProductVariant/');
    const variantId = idParts?.[1];
    return variantId && Number(variantId) === selectedVariantId;
  });

  // If no matching variant found, find first available variant with sufficient quantity
  if (!selectedVariant) {
    selectedVariant =
      variants?.find(
        (variant: any) =>
          variant.availableForSale &&
          variant.quantityAvailable &&
          variant.quantityAvailable > 0,
      ) ?? variants?.[0];
  }

  return selectedVariant;
};

export default function ProductDetailsCard({
  data,
  products,
  setProducts,
  title,
  variationsMap,
  currentProductUrl,
  shouldFetch,
  setShouldFetch,
  isPDPYMALCard,
  selectedVariantId,
}: Props) {
  const env = useEnv();
  const xgenClient = useXgenClient();
  const {APTOS_QTY_THRESHOLD} = env;
  const [currentProductHandle, setCurrentProductHandle] = useState(
    currentProductUrl?.split('/products/')[1],
  );
  const aptosQtyThreshold = parseInt(APTOS_QTY_THRESHOLD, 10);
  const [updatedColorProduct, setUpdatedColorProduct] = useState<
    ProductRouteProduct | undefined
  >(undefined);
  const [selectedVariant, setSelectedVariant] = useState<
    ProductRouteProduct | undefined
  >(undefined);
  const [availableForSale, setAvailableForSale] = useState(false);
  const itemVariants: any = [];
  //const {locale} = useContext(GlobalContext);
  const {locale, eventTrackingData} = useContext(GlobalContext); //PEAK ACTIVITY ADDITION

  const [familyTag, setFamilyTag] = useState<string | undefined>(data?.id);
  //PEAK ACTIVITY ADDITION STARTS
  const customer = eventTrackingData?.customer;
  //PEAK ACTIVITY ADDITION ENDS
  // Fetch the product details for the selected product
  useEffect(() => {
    const selectedProduct = products.find(
      (el: any) => el.handle === currentProductHandle,
    );
    if (selectedProduct) {
      selectedProduct.isQuickView = true;
      selectedProduct.variants.nodes.forEach((element: object) => {
        itemVariants.push(element);
      });
      (async () => {
        try {
          // Use the helper function to select the best variant
          const selectedVariant = selectBestVariant(
            selectedProduct.variants?.nodes,
            selectedVariantId,
            aptosQtyThreshold,
          );
          selectedProduct.selectedVariant = selectedVariant;
          //PEAK ACTIVITY ADDITIONS STARTS
          setSelectedVariant(selectedVariant as any);
          //console.log('QV modal: Variant set to:', firstAvailableVariant);
          //PEAK ACTIVITY ADDITIONS ENDS
          setUpdatedColorProduct(selectedProduct);
          setAvailableForSale(selectedVariant.availableForSale);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('Error in async block: ', error);
        }
      })();
    } else {
      if (isPDPYMALCard && shouldFetch) {
        // This condition fires if the section is the YMAL quickview on the PDP --
        fetch(`${locale.pathPrefix}/api/products/${currentProductHandle}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => {
            // Handle the response from the server
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
            // Handle the successful submission response
          })
          .then((data: any) => {
            setShouldFetch(false);
            if (data.product) {
              data.product.isQuickView = true;
              data.product.variants?.nodes.forEach((element: object) => {
                itemVariants.push(element);
              });

              (async () => {
                try {
                  const updatedVariants = data.product.variants?.nodes;

                  setSelectedVariant(updatedVariants[0]);
                  setUpdatedColorProduct({
                    ...data.product,
                    variants: {nodes: updatedVariants},
                  });
                  setAvailableForSale(updatedVariants[0].availableForSale);

                  setProducts((prevProducts) => {
                    const newArray = Array.isArray(prevProducts)
                      ? [...prevProducts]
                      : [];
                    return [...newArray, data.product];
                  });
                } catch (error) {
                  console.error('Error in async block:', error);
                }
              })();
            }
          })
          .catch((error) => {
            // Handle any errors that occur during the submission process

            console.error('Error submitting the form:', error);
          });
      } else if (isPDPYMALCard && !shouldFetch) {
        // YMALPDP quickview - do nothing bc of shouldFetch === false
      } else {
        // This is used by collection quickview
        fetch(`${locale.pathPrefix}/api/products/${currentProductHandle}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => {
            // Handle the response from the server
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
            // Handle the successful submission response
          })
          .then((data: any) => {
            if (data.product) {
              data.product.isQuickView = true;
              data.product.variants.nodes.forEach((element: object) => {
                itemVariants.push(element);
              });

              (async () => {
                // Use the helper function to select the best variant
                const selectedVariant = selectBestVariant(
                  data.product.variants?.nodes,
                  selectedVariantId,
                  aptosQtyThreshold,
                );
                setSelectedVariant(selectedVariant);
                setUpdatedColorProduct(data.product);
                setAvailableForSale(selectedVariant.availableForSale);
              })();

              const productArray = products;
              productArray.push(data.product);
              setProducts(productArray);
            }
          })
          .catch((error) => {
            // Handle any errors that occur during the submission process

            console.error('Error submitting the form:', error);
          });
      }
    }

    // Update Cio Family Tag
    if (selectedProduct && familyTag?.includes('gid://shopify/Product/')) {
      const {cioFamilyTag} = generateCioFamilyTag(selectedProduct.tags);
      setFamilyTag(cioFamilyTag);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentProductHandle,
    itemVariants,
    locale.pathPrefix,
    products,
    setProducts,
    isPDPYMALCard,
    shouldFetch,
    setShouldFetch,
    selectedVariantId,
    aptosQtyThreshold,
  ]);
  //PEAK ACTIVITY ADDITIONS STARTS
  useEffect(() => {
    if (!selectedVariant || !updatedColorProduct || !xgenClient) {
      return;
    }

    // console.log('QV modal: Selected variant changed:', selectedVariant);
    // console.log('QV modal: Full product data:', updatedColorProduct);

    // Call pushQuickViewItemEvent with the full product data and updated variant
    // Call pushQuickViewItemEvent with the full product data and updated variant
    pushQuickViewItemEvent(
      updatedColorProduct, // Full product data
      selectedVariant, // The selected variant
      updatedColorProduct.currency, // Pass currency from the product if needed
      customer, // Customer data (if applicable)
      updatedColorProduct.index || 0, // Index of the product (if applicable)
    );
  }, [selectedVariant, updatedColorProduct, xgenClient, customer]);

  useEffect(() => {
    const selectedProduct = products.find(
      (el: any) => el.handle === currentProductHandle,
    );
    if (selectedProduct) {
      pushViewItemXgen(xgenClient, selectedProduct, customer);
    }
    // NOTE: Is it intentional that we're not using any deps? The XGEN client might not be ready by the time the component mounts.
  }, []);

  // console.log('QV modal: Current selected variant:', selectedVariant);
  //console.log('QV modal: Updated color product:', updatedColorProduct);
  //PEAK ACTIVITY ADDITIONS ENDS
  return (
    <div
      className="page-width max-h-[80vh] md:max-h-[100%]"
      data-cnstrc-product-detail
      data-cnstrc-item-id={stripGlobalId(updatedColorProduct?.id)}
      data-cnstrc-item-variation-id={stripGlobalId(selectedVariant?.id)}
      data-cnstrc-item-name={title}
      data-cnstrc-item-price={selectedVariant?.price?.amount}
    >
      {/* Mobile Title */}
      {title && updatedColorProduct && (
        <div className="md:hidden">
          <h1 className="px-10 pb-[18px] text-[24px] lg:text-[26px]">
            {selectedVariant?.product?.title}
          </h1>
        </div>
      )}
      <div className="md:flex">
        {/* Gallery */}
        <ProductGallery
          storefrontProduct={updatedColorProduct}
          selectedVariant={selectedVariant}
        />

        {/* Widget (desktop) */}
        {updatedColorProduct && (
          <div
            className={clsx(
              'h-full md:w-1/2',
              'md:float-right lg:inline-block',
            )}
          >
            <div>
              <div className="w-full justify-start pb-4 md:pl-4">
                {/* Tablet Title */}
                {title && updatedColorProduct && (
                  <div className="hidden md:block lg:hidden">
                    <h1 className="text-left text-[24px]">
                      {selectedVariant?.product?.title}
                    </h1>
                  </div>
                )}
                <ProductWidget
                  data={data}
                  product={updatedColorProduct}
                  title={title}
                  variationsMap={variationsMap}
                  selectedVariant={selectedVariant}
                  availableForSale={availableForSale}
                  variants={updatedColorProduct.variants.nodes}
                  setCurrentProductHandle={setCurrentProductHandle}
                  setShouldFetch={setShouldFetch}
                  isPDPYMALCard={isPDPYMALCard}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
