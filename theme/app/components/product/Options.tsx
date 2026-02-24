import {VariantSelector} from '@shopify/hydrogen';
import {
  ProductOption,
  ProductVariant,
} from '@shopify/hydrogen/storefront-api-types';
import Tippy from '@tippyjs/react/headless';
import clsx from 'clsx';
import {forwardRef, useEffect} from 'react';
import React, {useState} from 'react';

import Tooltip from '~/components/elements/Tooltip';
import Modal from '~/components/global/ModalCard';
import type {SanityCustomProductOption} from '~/lib/sanity';
import {ExtendedProduct} from '~/lib/shopify/types';
import {getInventoryStatus} from '~/lib/utils';
import type {CollectionWithNodes} from '~/types/shopify';

import {Link} from '../Link';
import SizeChart from './SizeChart';

type ExtendedProductVariant = ProductVariant & {aptosQty?: number};
export default function ProductOptions({
  product,
  variants,
  options,
  selectedVariant,
  customProductOptions,
  siblingProducts,
  colorSwatches,
  setSelectedVariant,
  threshold,
}: {
  product: ExtendedProduct;
  variants?: ExtendedProductVariant[];
  options: ProductOption[];
  selectedVariant: ProductVariant;
  customProductOptions?: SanityCustomProductOption[];
  siblingProducts?: string[];
  colorSwatches?: CollectionWithNodes;
  setSelectedVariant: (variant: ProductVariant) => void;
  threshold: number;
}) {
  // Get the first and second selected options from the selected variant (if it exists) to set the initial active options
  const selectedOptions = selectedVariant?.selectedOptions || [];
  const firstOption = selectedOptions[0] || {};
  const secondOption = selectedOptions[1] || {};
  const initialActiveOptions = {
    [secondOption.name || firstOption.name || '']:
      secondOption.value || firstOption.value || '',
  };
  const [activeOptions, setActiveOptions] =
    useState<Record<string, string>>(initialActiveOptions);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = function (product: object) {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };
  const handleOptionClick = (e: any, name: string, value: string) => {
    e.preventDefault();
    setActiveOptions((prevActiveOptions) => ({
      ...prevActiveOptions,
      [name]: value,
    }));

    if (name === 'Size') {
      // Find the variant that matches the selected size
      const selectedSizeVariant = (variants ?? []).find((variant) =>
        variant.selectedOptions.some(
          (option) => option.name === 'Size' && option.value === value,
        ),
      );

      if (selectedSizeVariant) {
        setSelectedVariant(selectedSizeVariant);
      }
    }

    if (name === 'Value') {
      // Find the variant that matches the selected size
      const selectedSizeVariant = (variants ?? []).find((variant) =>
        variant.selectedOptions.some(
          (option) => option.name === 'Value' && option.value === value,
        ),
      );

      if (selectedSizeVariant) {
        setSelectedVariant(selectedSizeVariant);
      }
    }
  };
  useEffect(() => {
    if (selectedVariant?.selectedOptions) {
      const updatedActiveOptions = selectedVariant.selectedOptions.reduce(
        (acc, option) => ({
          ...acc,
          [option.name]: option.value,
        }),
        {} as Record<string, string>,
      );
      setActiveOptions(updatedActiveOptions);
    }
  }, [selectedVariant]);

  const legendValue =
    product?.isQuickView === undefined
      ? selectedVariant?.selectedOptions[1]?.value ||
        selectedVariant?.selectedOptions?.[0]?.value
      : product?.isCatalog
      ? selectedVariant.selectedOptions?.[1].value
      : activeOptions.Size;

  return (
    <div className="relative grid gap-4">
      {/* Each option will show a label and option value <Links> */}
      <VariantSelector
        handle={product.handle}
        options={options}
        variants={variants}
      >
        {({option}) => {
          // Check if current product has a valid custom option type.
          // If so, render a custom option component.
          const customProductOption = customProductOptions?.find(
            (customOption) => customOption.title === option.name,
          );
          if (option.name === 'Color') {
            return null;
          }
          return (
            <div>
              <legend className="pb-4 text-xs text-swatch">
                <span className="font-bold">{option.name}</span> —{' '}
                {/* PDP uses newSelectedVariant.selectedOptions -- PLP quick view uses selectedVariant.selectedOptions */}
                {legendValue}
              </legend>
              <div className="flex flex-wrap items-center gap-[10px]">
                {option.values.map(
                  ({value, to, isActive, isAvailable}, index) => {
                    const matchingVariant = variants?.[index];
                    const isDigitalGiftCard =
                      product.handle === 'digital-gift-card';
                    const isTruelyOutOfStock = isDigitalGiftCard
                      ? false
                      : (matchingVariant?.aptosQty ??
                          matchingVariant?.quantityAvailable ??
                          0) <= 0;

                    const [isOutOfStock, quantityAvailable] = matchingVariant
                      ? getInventoryStatus(
                          product,
                          matchingVariant,
                          threshold,
                          true,
                        )
                      : [true, 0];

                    const id = `option-${option.name}-${value}`;

                    // Check if it's a non-color option and it's the first option when isQuickView is true
                    const isFirstNonColorOption =
                      product.isQuickView &&
                      index === 0 &&
                      customProductOption?._type !==
                        'customProductOption.color';

                    // Set isActive based on conditions
                    isActive =
                      isFirstNonColorOption ||
                      activeOptions[option.name] === value;

                    switch (customProductOption?._type) {
                      case 'customProductOption.color': {
                        const foundCustomOptionValue =
                          customProductOption.colors.find(
                            (color) => color.title === value,
                          );

                        return (
                          <Tippy
                            placement="top"
                            render={() => {
                              if (!foundCustomOptionValue) {
                                return null;
                              }
                              return (
                                <Tooltip label={foundCustomOptionValue.title} />
                              );
                            }}
                            key={id}
                          >
                            <ColorButton
                              to={to}
                              isSelected={isActive}
                              isAvailable={
                                isTruelyOutOfStock
                                  ? !isTruelyOutOfStock
                                  : isAvailable
                              }
                              hex={foundCustomOptionValue?.hex || '#fff'}
                            />
                          </Tippy>
                        );
                      }
                      case 'customProductOption.size': {
                        const foundCustomOptionValue =
                          customProductOption.sizes.find(
                            (size) => size.title === value,
                          );

                        return (
                          <Tippy
                            placement="top"
                            render={() => {
                              if (!foundCustomOptionValue) {
                                return null;
                              }
                              return (
                                <Tooltip
                                  label={`${foundCustomOptionValue.width}cm x ${foundCustomOptionValue.height}cm`}
                                />
                              );
                            }}
                            key={id}
                          >
                            <OptionButton
                              to={to}
                              isSelected={isActive}
                              isAvailable={
                                isTruelyOutOfStock
                                  ? !isTruelyOutOfStock
                                  : isAvailable
                              }
                            >
                              {value}
                            </OptionButton>
                          </Tippy>
                        );
                      }
                      default:
                        return (
                          <div key={id}>
                            <button
                              className={clsx([
                                'flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-none border bg-optionGray text-sm leading-none',
                                isActive && !isTruelyOutOfStock
                                  ? 'border-black bg-primary text-white'
                                  : 'border-lightGray text-primary',
                                (isTruelyOutOfStock || !isAvailable) &&
                                  (isActive
                                    ? 'cross-overlay active relative border-red text-red'
                                    : 'cross-overlay opacity-80'),
                              ])}
                              name={option.name}
                              value={value}
                              onClick={(e) =>
                                handleOptionClick(e, option.name, value)
                              }
                            >
                              {value}
                            </button>
                          </div>
                        );
                    }
                  },
                )}
              </div>
            </div>
          );
        }}
      </VariantSelector>
      {product?.sizeChart && (
        <>
          <button
            aria-label="Open size chart"
            className={clsx('absolute right-0 top-0 text-xs underline')}
            onClick={() => openModal(product)}
          >
            Size Chart
          </button>
          {isModalOpen === true && (
            <Modal
              isModalOpen={isModalOpen}
              closeModal={closeModal}
              modalType="size-chart"
            >
              {
                <SizeChart
                  chartData={product?.sizeChart}
                  title={product?.title}
                />
              }
            </Modal>
          )}
        </>
      )}
    </div>
  );
}

const OptionButton = forwardRef<
  HTMLAnchorElement,
  {
    to: string;
    isSelected: boolean;
    isAvailable: boolean;
    children: React.ReactNode;
  }
>((props, ref) => {
  const {to, isSelected, children, isAvailable} = props;
  return (
    <Link
      ref={ref}
      to={to}
      preventScrollReset
      replace
      prefetch="intent"
      className={clsx([
        'relative flex h-[40px] w-[40px] cursor-pointer items-center justify-center overflow-hidden rounded-none border bg-optionGray text-sm leading-none',
        isSelected
          ? 'border-black bg-primary text-white'
          : 'border-lightGray text-primary',
        !isAvailable && 'cross-overlay pointer-events-none opacity-80',
      ])}
      aria-disabled={!isAvailable}
    >
      {children}
    </Link>
  );
});

const ColorButton = forwardRef<
  HTMLAnchorElement,
  {to: string; hex: string; isSelected: boolean; isAvailable: boolean}
>((props, ref) => {
  const {to, hex, isSelected, isAvailable} = props;

  return (
    <Link
      ref={ref}
      to={to}
      preventScrollReset
      replace
      prefetch="intent"
      className={clsx([
        'relative flex h-8 w-8 items-center justify-center rounded-full border',
        isSelected
          ? 'border-offBlack'
          : 'cursor-pointer border-transparent hover:border-black hover:border-opacity-30',
        !isAvailable && 'cross-overlay pointer-events-none opacity-80',
      ])}
      aria-disabled={!isAvailable}
    >
      <div
        className="rounded-full"
        style={{
          background: hex,
          height: 'calc(100% - 4px)',
          width: 'calc(100% - 4px)',
        }}
      ></div>
    </Link>
  );
});
