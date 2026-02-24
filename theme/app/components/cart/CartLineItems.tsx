import {CartForm} from '@shopify/hydrogen';
import type {
  Cart,
  CartLine,
  CartLineUpdateInput,
  ComponentizableCartLine,
} from '@shopify/hydrogen/storefront-api-types';
import {flattenConnection, Image} from '@shopify/hydrogen-react';
import clsx from 'clsx';
import {useEffect, useState} from 'react';

import SpinnerIcon from '~/components/icons/Spinner';
import {Link} from '~/components/Link';
import {useCartFetchers} from '~/hooks/useCartFetchers';
import {useEnv} from '~/hooks/useEnv';
import {syncInventoryInShopifyBySku} from '~/utils/product';

import Currency from '../global/Currency';
import StockInfo from '../product/StockInfo';
import CartItemQuantity from './CartItemQuantity';
import ItemRemoveButton from './ItemRemoveButton';
import LineItemCart from './LineItemCart';

export function CartLineItems({
  linesObj,
  cart,
}: {
  linesObj: Cart['lines'] | undefined;
  cart?: Cart;
}) {
  const lines = flattenConnection(linesObj);
  return (
    <div>
      <div
        className="cart-rows flex-grow pt-5"
        role="table"
        aria-label="Shopping cart"
      >
        <div
          role="row"
          className="hidden justify-between text-xs md:flex md:pb-2"
        >
          <div role="columnheader" className="md:w-1/2">
            Item
          </div>
          <div role="columnheader" className="md:flex-grow-1">
            Price
          </div>
          <div role="columnheader" className="md:flex-grow-1">
            Qty
          </div>
          <div role="columnheader" className="md:flex md:self-end">
            Subtotal
          </div>
        </div>
        {lines.map((line) => (
          <LineItemCart key={line.id} lineItem={line} cart={cart} />
        ))}
      </div>
    </div>
  );
}
export function MiniCartLineItems({
  linesObj,
  open,
}: {
  linesObj: Cart['lines'] | undefined;
  open: boolean;
}) {
  const lines = flattenConnection(linesObj);
  return (
    <div className="mini-cart-rows" role="table" aria-label="Shopping cart">
      <div role="row" className="sr-only">
        <div role="columnheader">Product image</div>
        <div role="columnheader">Product details</div>
        <div role="columnheader">Price</div>
      </div>
      {lines.map((line) => {
        return <LineItem key={line.id} lineItem={line} open={open} />;
      })}
    </div>
  );
}
//
function LineItem({
  lineItem,
  open,
}: {
  lineItem: CartLine | ComponentizableCartLine;
  open: boolean;
}) {
  const {merchandise} = lineItem;
  const {sku, quantityAvailable} = merchandise;
  const env = useEnv();
  const [available, setAvailable] = useState<number | null>();
  const {APTOS_QTY_THRESHOLD} = useEnv();
  const thresholdNumber: number = parseFloat(APTOS_QTY_THRESHOLD);
  const isDigitalGiftCard = merchandise.product.handle === 'digital-gift-card';

  useEffect(() => {
    if (!(sku && env && open)) return;
    if (isDigitalGiftCard) {
      // Digital gift cards never have inventory constraints
      setAvailable(Number.MAX_SAFE_INTEGER);
      return;
    }
    // Fetch the qty from aptos if it exists, otherwise use the quantityAvailable from the storefront API
    syncInventoryInShopifyBySku(sku)
      .then((res) => {
        if (res.ok) return res.json();
      })
      .then((json: any) => {
        const aptosQty = json.quantityAvailable;
        if (aptosQty !== undefined) {
          setAvailable(aptosQty);
        } else {
          // Fallback to quantityAvailable from Shopify (no threshold applied)
          setAvailable(quantityAvailable ?? 0);
        }
      })
      .catch(() => setAvailable(quantityAvailable));
  }, [open, isDigitalGiftCard, sku, env, quantityAvailable, thresholdNumber]);

  const updatingItems = useCartFetchers(CartForm.ACTIONS.LinesUpdate);
  const removingItems = useCartFetchers(CartForm.ACTIONS.LinesRemove);

  // Check if the line item is being updated, as we want to show the new quantity as optimistic UI
  let updatingQty;
  const updating =
    updatingItems?.find((fetcher) => {
      const formData = fetcher?.formData;

      if (formData) {
        const formInputs = CartForm.getFormInput(formData);
        return (
          Array.isArray(formInputs?.inputs?.lines) &&
          formInputs?.inputs?.lines?.find((line: CartLineUpdateInput) => {
            updatingQty = line.quantity;
            return line.id === lineItem.id;
          })
        );
      }
    }) && updatingQty;

  // Check if the line item is being removed, as we want to show the line item as being deleted
  const deleting = removingItems.find((fetcher) => {
    const formData = fetcher?.formData;
    if (formData) {
      const formInputs = CartForm.getFormInput(formData);
      return (
        Array.isArray(formInputs?.inputs?.lineIds) &&
        formInputs?.inputs?.lineIds?.find(
          (lineId: CartLineUpdateInput['id']) => lineId === lineItem.id,
        )
      );
    }
  });

  const firstVariant = merchandise.selectedOptions[0];
  const hasDefaultVariantOnly =
    firstVariant.name === 'Title' && firstVariant.value === 'Default Title';
  return (
    <div
      role="row"
      className={clsx(
        'relative flex border-collapse items-start border-b border-t border-lightGray py-5 last:border-b-0',
        deleting && 'opacity-50',
      )}
    >
      {/* Image */}
      <div role="cell" className="mr-4 flex-shrink-0 self-start">
        {merchandise.image && (
          <div className="flex flex-col items-center gap-1">
            <Link to={`/products/${merchandise.product.handle}`}>
              <Image
                data={merchandise.image}
                width={80}
                height={116}
                alt={merchandise.title}
              />
            </Link>
          </div>
        )}
      </div>

      {/* Title */}
      <div
        role="cell"
        className="minicart-sizer flex-grow-1 flex flex-col items-start gap-[10px] text-primary"
      >
        <Link
          to={`/products/${merchandise.product.handle}`}
          className="w-[65%] text-[12px] hover:underline"
        >
          {merchandise.product.title}
        </Link>

        {/* Options */}
        {!hasDefaultVariantOnly && (
          <ul className="mt-1 flex flex-col gap-[5px] space-y-1 text-xs text-primary">
            {merchandise.selectedOptions
              .slice()
              .sort((b, a) => {
                if (a.name === 'Size' && b.name === 'Color') {
                  return -1; // "Size" comes before "Color"
                } else if (a.name === 'Color' && b.name === 'Size') {
                  return 1; // "Color" comes after "Size"
                }
                return 0; // Maintain the order for other options
              })
              .map(({name, value}) => (
                <li key={name} style={{marginTop: '0px'}}>
                  <span className="font-bold">{name} - </span>
                  <span className="font-normal">{value}</span>
                </li>
              ))}
          </ul>
        )}
        <div className="mt-[-8px] h-fit text-xs font-bold uppercase text-red">
          <StockInfo
            quantityAvailable={available || 0}
            threshold={thresholdNumber}
          />
        </div>
        <div className="flex w-full items-center justify-between gap-4">
          {/* Quantity */}
          <CartItemQuantity line={lineItem} submissionQuantity={updating} />
          <ItemRemoveButton lineIds={[lineItem.id]} lineItem={lineItem} />
        </div>
      </div>

      {/* Price */}
      <div className="price-element absolute right-0 flex text-[12px] leading-none">
        {updating ? (
          <SpinnerIcon width={24} height={24} />
        ) : (
          <Currency data={lineItem.cost.totalAmount} />
        )}
      </div>
    </div>
  );
}
