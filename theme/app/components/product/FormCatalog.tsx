import {type ShopifyAnalyticsPayload} from '@shopify/hydrogen';
import type {ProductVariant} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import React, {useEffect, useState} from 'react';

import Button, {squareButtonStyles} from '~/components/elements/Button';
import WarningIcon from '~/components/icons/Warning';
import AddToCartButton from '~/components/product/buttons/AddToCartButtonSquare';
import ProductOptions from '~/components/product/Options';
import ProductColorOptions from '~/components/product/OptionsColor';
import {useEnv} from '~/hooks/useEnv';
import {CioResultData} from '~/lib/constructor/types';
import type {SanityCustomProductOption} from '~/lib/sanity';
import {ExtendedProduct} from '~/lib/shopify/types';
import {getInventoryStatus, hasMultipleProductOptions} from '~/lib/utils';

export default function ProductForm({
  data,
  product,
  variants,
  selectedVariant,
  analytics,
  customProductOptions,
  availableForSale,
  colorSwatches,
  setCurrentProductHandle,
}: {
  data: CioResultData;
  product: ExtendedProduct;
  variants?: ProductVariant[];
  selectedVariant: ProductVariant;
  analytics?: ShopifyAnalyticsPayload;
  customProductOptions?: SanityCustomProductOption[];
  availableForSale?: boolean;
  colorSwatches?: any;
  setCurrentProductHandle: (handle: string) => void;
}) {
  const {APTOS_QTY_THRESHOLD} = useEnv();
  const threshold: number = parseFloat(APTOS_QTY_THRESHOLD);

  const multipleProductOptions = hasMultipleProductOptions(product.options);

  const [selectedQuantity, setSelectedQuantity] = useState(1); // Step 1: Add a state variable for quantity

  const handleQuantityChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSelectedQuantity(parseInt(event.target.value));
  };

  const [newSelectedVariant, setSelectedVariant] =
    useState<ProductVariant>(selectedVariant);
  const [newAvailableForSale, setNewAvailableForSale] =
    useState(availableForSale);

  const [isOutOfStock] = getInventoryStatus(
    product,
    newSelectedVariant,
    threshold,
    true,
  );

  useEffect(() => {
    setSelectedVariant(product.variants.nodes[0]);
  }, [product]);

  useEffect(() => {
    setNewAvailableForSale(newSelectedVariant.availableForSale);
  }, [newSelectedVariant]);

  return (
    <>
      {multipleProductOptions && (
        <>
          <ProductColorOptions
            product={product}
            options={product.options}
            selectedVariant={newSelectedVariant}
            setCurrentProductHandle={setCurrentProductHandle}
          />

          <ProductOptions
            product={product}
            variants={variants}
            options={product.options}
            selectedVariant={newSelectedVariant}
            customProductOptions={customProductOptions}
            colorSwatches={colorSwatches}
            setSelectedVariant={setSelectedVariant}
            threshold={threshold}
          />
        </>
      )}
      <div className="pb-4">
        <label htmlFor="quantity" className="block py-4 text-xs font-bold">
          Qty
        </label>
        <select
          className="border border-gray py-2 pl-3 pr-1"
          id="quantity"
          name="quantity"
          disabled={isOutOfStock}
          value={selectedQuantity}
          onChange={handleQuantityChange}
        >
          {Array.from({length: 10}, (_, index) => (
            <option key={index} value={index + 1}>
              {index + 1}
            </option>
          ))}
        </select>
      </div>

      {/* Sold out */}
      {isOutOfStock && (
        <div className="mb-4 text-xs font-bold text-red">Out Of Stock</div>
      )}

      {/* Sale */}
      {newAvailableForSale && selectedVariant?.compareAtPrice && (
        <div className="mb-4 flex flex-row items-center text-xs font-bold uppercase text-red">
          <WarningIcon />
          Final Sale - See Details
        </div>
      )}

      <div className="flex flex-col space-y-4">
        <AddToCartButton
          lines={[
            {
              merchandiseId: newSelectedVariant.id,
              quantity: selectedQuantity,
            },
          ]}
          disabled={isOutOfStock}
          buttonClassName="w-full h-[50px]"
        />
        <Button
          to={`/products/${product.handle}`}
          className={clsx([
            squareButtonStyles({mode: 'default', tone: 'light'}),
            'w-full text-primary',
          ])}
        >
          SEE DETAILS
        </Button>
      </div>
    </>
  );
}
