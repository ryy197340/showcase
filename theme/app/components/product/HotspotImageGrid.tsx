import type {Product} from '@shopify/hydrogen/storefront-api-types';
import Tippy from '@tippyjs/react/headless';
import clsx from 'clsx';
import {useEffect, useState} from 'react';

//import {useGid} from '~/lib/utils';
import LocalizedA from '../global/LocalizedA';

type Props = {
  id: string;
  productGid: string;
  variantGid?: string;
  x: number;
  y: number;
  relatedProducts?: any;
  setRelatedProducts?: (products: Product[]) => void;
  setRelatedProductsHandles?: (products: Product[]) => void;
  isCatalogHotspot?: boolean;
  isImageGridImage?: boolean;
  setActiveHotspot?: () => void;
  hotspotKey?: string;
  setActiveProduct?: (products: Product) => void;
  setPrimaryProduct?: (products: Product[]) => void;
  setIsModalOpen?: () => void;
};

export default function ProductHotspot({
  id,
  productGid,
  variantGid,
  x,
  y,
  relatedProducts,
  setRelatedProducts,
  setRelatedProductsHandles,
  isCatalogHotspot,
  isImageGridImage,
  setActiveHotspot,
  hotspotKey,
  setActiveProduct,
  setPrimaryProduct,
  setIsModalOpen,
}: Props) {
  const [storefrontProduct, setStorefrontProduct] = useState<Product | null>(
    null,
  );

  const handleClick = () => {
    setActiveHotspot(hotspotKey);
    setActiveProduct(storefrontProduct);
    setPrimaryProduct(storefrontProduct);
    setIsModalOpen(true);
    if (relatedProducts && !isImageGridImage) {
      // we use the handles for the api call to get the main active product info from Shopify
      const handles = [];
      relatedProducts.map(function (item) {
        handles.push(item.slug);
      });
      setRelatedProductsHandles(handles);
      setRelatedProducts(null);
    } else if (relatedProducts && isImageGridImage) {
      // we use the related product IDs and hit a different API endpoint, for the related products call
      const ids = [];
      relatedProducts.map(function (item) {
        const relatedProductId = item.product._ref.split('-')[1];
        ids.push(relatedProductId);
      });
      setRelatedProductsHandles(ids);
      setRelatedProducts(null);
    }
  };

  useEffect(() => {
    const fetchProductInfo = async () => {
      try {
        const response = await fetch(`/api/style/products/${id}`);
        const data = await response.json();
        setStorefrontProduct(data[0]);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching product information:', error);
      }
    };
    fetchProductInfo();
  }, [id]);

  if (!storefrontProduct) {
    return null;
  }

  return (
    <>
      {storefrontProduct && (
        <Tippy placement="top">
          <LocalizedA
            className={clsx(
              'hotspot absolute z-10 flex h-full w-full items-center justify-center',
            )}
            href={`/products/${storefrontProduct.handle}`}
            onClick={(e) => {
              if (isCatalogHotspot) {
                e.preventDefault();
                handleClick();
              }
            }}
          >
            <div className="relative" />
          </LocalizedA>
        </Tippy>
      )}
    </>
  );
}
