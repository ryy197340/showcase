import type {Product} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import {useContext, useEffect, useState} from 'react';

import ProductGallery from '~/components/product/GalleryQuickView';
import ProductWidget from '~/components/product/WidgetCardPLP';
import {CioResultData, VariationsMap} from '~/lib/constructor/types';
import {GlobalContext} from '~/lib/utils';
import type {ProductWithNodes} from '~/types/shopify';
import {generateCioFamilyTag} from '~/utils/product';

type Props = {
  // Collection PLP Quick View
  data?: CioResultData;
  products: Product[];
  title?: string;
  variationsMap?: VariationsMap;
  currentProductUrl?: string;
};

export default function ProductDetailsCard({
  data,
  products,
  title,
  variationsMap,
  currentProductUrl,
}: Props) {
  const [familyTag, setFamilyTag] = useState<string>('');

  const [currentProductHandle, setCurrentProductHandle] = useState(
    data?.handle,
  );
  const [updatedColorProduct, setUpdatedColorProduct] = useState<
    ProductWithNodes | undefined
  >(undefined);
  const [selectedVariant, setSelectedVariant] = useState<
    ProductWithNodes | undefined
  >(undefined);
  const [availableForSale, setAvailableForSale] = useState(false);
  const {locale} = useContext(GlobalContext);
  useEffect(() => {
    const itemVariants: any = [];
    const selectedProduct = products.find(
      (el: any) => el.handle === currentProductHandle,
    );
    if (selectedProduct) {
      selectedProduct.selectedVariant = selectedProduct.variants.nodes[0];
      selectedProduct.isQuickView = true;
      selectedProduct.variants.nodes.forEach((element: object) => {
        itemVariants.push(element);
      });
      setSelectedVariant(selectedProduct.variants.nodes[0]);
      setUpdatedColorProduct(selectedProduct);
      setAvailableForSale(selectedProduct.variants.nodes[0].availableForSale);
      setCurrentProductHandle(selectedProduct.handle);
      const {cioFamilyTag} = generateCioFamilyTag(selectedProduct.tags);
      setFamilyTag(cioFamilyTag);
    } else {
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
            setSelectedVariant(data.product.variants.nodes[0]);
            setUpdatedColorProduct(data.product);
            setAvailableForSale(
              data.product.variants.nodes[0].availableForSale,
            );
            setCurrentProductHandle(data.product.handle);
            const productArray = products;
            productArray.push(data.product);
            const {cioFamilyTag} = generateCioFamilyTag(
              data?.product?.variants?.nodes[0]?.tags,
            );
            setFamilyTag(cioFamilyTag);
          }
        })
        .catch((error) => {
          // Handle any errors that occur during the submission process
          // eslint-disable-next-line no-console
          console.error('Error submitting the form:', error);
        });
    }
  }, [
    currentProductHandle,
    products,
    data,
    selectedVariant,
    locale.pathPrefix,
  ]);

  return (
    <div
      className="page-width max-h-[80vh] md:max-h-[100%]"
      data-cnstrc-product-detail
      data-cnstrc-item-id={selectedVariant?.product?.id}
      data-cnstrc-item-variation-id={selectedVariant?.id}
      data-cnstrc-item-name={title}
      data-cnstrc-item-price={selectedVariant?.price?.amount}
    >
      {/* Mobile Title */}
      {title && updatedColorProduct && (
        <div className="lg:hidden">
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
            {/* it is */}
            <div className="">
              <div className="w-full justify-start pb-4 md:pl-4">
                <ProductWidget
                  data={data}
                  product={updatedColorProduct}
                  title={title}
                  // variationsMap is populated w/ Shopify data
                  variationsMap={variationsMap}
                  selectedVariant={selectedVariant}
                  availableForSale={availableForSale}
                  variants={updatedColorProduct.variants.nodes}
                  setCurrentProductHandle={setCurrentProductHandle}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
