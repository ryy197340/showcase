import {
  ProductOption,
  ProductVariant,
} from '@shopify/hydrogen/storefront-api-types';
import Tippy from '@tippyjs/react/headless';
import clsx from 'clsx';
import {useContext, useEffect, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

import Tooltip from '~/components/elements/Tooltip';
import {useXgenClient} from '~/contexts/XgenClientContext';
import {ColorSwatches, ExtendedProduct} from '~/lib/shopify/types';
import {GlobalContext} from '~/lib/utils';
import {pushViewItemXgen} from '~/utils/eventTracking';

import {Link} from '../Link';

export default function ProductColorOptions({
  product,
  options,
  selectedVariant,
  setCurrentProductHandle,
  setShouldFetch,
  isPDPYMALCard,
}: {
  product: ExtendedProduct;
  options: ProductOption[];
  selectedVariant: ProductVariant;
  setCurrentProductHandle: (handle: string) => void;
  setShouldFetch?: () => void;
  isPDPYMALCard?: boolean;
}) {
  const xgenClient = useXgenClient();
  const {customer, locale} = useContext(GlobalContext);
  const [colorSwatches, setColorSwatches] = useState<
    ColorSwatches | Record<string, never>
  >({});

  // Fetch color swatches from Shopify
  useEffect(() => {
    (async () => {
      const family = product.tags.find((tag) =>
        tag.toUpperCase().includes('FAMILY'),
      );

      const getColorSwatches = async (
        family: string | undefined,
      ): Promise<ColorSwatches | Record<string, never>> => {
        if (!family) {
          return {};
        }

        const req = await fetch(
          `/api/colorSwatchesFromShopify?family="${family}"`,
        );
        const res: ColorSwatches = await req.json();
        return res;
      };

      const swatchData = await getColorSwatches(family);
      setColorSwatches(swatchData);
    })();

    // add a "product" dependency so that the swatches will change on
    // FormCatalog too
  }, [product]);

  if (
    options.length === 0 ||
    options.find(
      (option) => option.name === 'Color' || option.name === 'color',
    ) === undefined ||
    options.find(
      (option) => option.name === 'Color' && option.values[0] === 'No Color',
    )
  )
    return;

  const handleOptionClick = (
    e: any,
    name: string,
    handle: string,
    colorSwatches: ColorSwatches['colorSwatches'],
  ) => {
    e.preventDefault();

    if (isPDPYMALCard && setShouldFetch) {
      setShouldFetch(true);
    }

    if (name === 'Color') {
      // Find the product that matches the selected color button's handle
      const selectedProduct = colorSwatches?.products?.edges.find(
        ({node}) => node.handle === handle,
      )?.node;

      if (selectedProduct) {
        pushViewItemXgen(
          xgenClient,
          selectedProduct,
          customer,
          locale.currency,
        );
        setCurrentProductHandle(selectedProduct.handle);
      }
    }
  };

  return (
    <div className="relative pb-4">
      <legend className="pb-4 text-xs text-swatch">
        {product?.styleNumber?.value && (
          <span>
            <span className="font-bold">Style Number</span> —{' '}
            {product.styleNumber.value}
          </span>
        )}
        <br />
        <span className="font-bold">Color</span> —{' '}
        {selectedVariant.selectedOptions[0].value}
      </legend>
      <div className="flex min-h-8 flex-wrap items-center gap-[10px]">
        {colorSwatches &&
          colorSwatches?.colorSwatches?.products?.edges?.map(({node}) => {
            const value = node.options.find(
              (opt: string) => opt.name === 'Color',
            )?.values[0];
            const to = `/products/${node.handle}`;
            const isActive =
              selectedVariant.selectedOptions[0].value ===
              node.options[0].values[0];

            return (
              <div
                className={`${
                  node.options[0].values[0] === 'Default Title' ? 'hidden' : ''
                }`}
                key={uuidv4()}
              >
                {product.isQuickView ? (
                  <Tippy
                    touch={false}
                    placement="top"
                    render={() => {
                      return <Tooltip label={node.options[0].values[0]} />;
                    }}
                    key={uuidv4()}
                  >
                    <button
                      className={clsx([
                        'isQuickView flex h-8 w-8 items-center justify-center rounded-full border',
                        isActive
                          ? 'border-offBlack text-white'
                          : 'border-transparent text-primary',
                        'cursor-pointer hover:border-black hover:border-opacity-30',
                      ])}
                      name={node.options[0].name}
                      value={value}
                      data-handle={node.handle}
                      onClick={(e) =>
                        handleOptionClick(
                          e,
                          node.options[0].name,
                          node.handle,
                          colorSwatches.colorSwatches,
                        )
                      }
                    >
                      <div
                        className="color-swatch rounded-full"
                        style={{
                          height: 'calc(100% - 4px)',
                          width: 'calc(100% - 4px)',
                          backgroundImage: `url(${node.metafield?.reference?.image?.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      ></div>
                    </button>
                  </Tippy>
                ) : (
                  <Link
                    key={uuidv4()}
                    to={to}
                    preventScrollReset
                    replace
                    prefetch="intent"
                    className={clsx([
                      'flex h-8 w-8 items-center justify-center rounded-full',
                    ])}
                  >
                    <Tippy
                      touch={false}
                      placement="top"
                      render={() => {
                        return <Tooltip label={node.options[0].values[0]} />;
                      }}
                      key={uuidv4()}
                    >
                      <div
                        className={clsx([
                          'flex h-8 w-8 items-center justify-center rounded-full border',
                          isActive
                            ? 'border-offBlack text-white'
                            : 'border-transparent text-primary',
                          'cursor-pointer hover:border-black hover:border-opacity-30',
                        ])}
                      >
                        <div
                          className="color-swatch rounded-full"
                          style={{
                            height: 'calc(100% - 4px)',
                            width: 'calc(100% - 4px)',
                            backgroundImage: `url(${node.metafield?.reference?.image?.url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        ></div>
                      </div>
                    </Tippy>
                  </Link>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
