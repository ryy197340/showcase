import type {Product} from '@shopify/hydrogen/storefront-api-types';
import Tippy from '@tippyjs/react/headless';
import clsx from 'clsx';
import {useEffect, useState} from 'react';

import {useGid} from '~/lib/utils';

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
  const handleClick = () => {
    setActiveHotspot(hotspotKey);
    setActiveProduct(storefrontProduct);
    setPrimaryProduct(storefrontProduct);
    if (relatedProducts) {
      const handles = [];
      relatedProducts.map(function (item) {
        handles.push(item.slug);
      });
      setRelatedProductsHandles(handles);
      setRelatedProducts(null);
    }
  };

  const storefrontProduct = useGid<Product>(productGid);

  if (!storefrontProduct) {
    return null;
  }
  return (
    <>
      {storefrontProduct && (
        <Tippy placement="top">
          <LocalizedA
            className={clsx(
              'absolute left-[50%] top-[50%] flex h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 animate-pulse items-center justify-center rounded-full bg-offBlack duration-300 ease-out',
              'hover:scale-125',
            )}
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
            href={`/products/${storefrontProduct.handle}`}
            onClick={(e) => {
              if (isCatalogHotspot) {
                e.preventDefault();
                handleClick();
              }
            }}
          >
            <div className="relative h-[4px] w-[4px] rounded-full bg-white" />
          </LocalizedA>
        </Tippy>
      )}
    </>
  );
}
