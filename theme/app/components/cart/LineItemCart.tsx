import {CartForm} from '@shopify/hydrogen';
import {
  Cart,
  CartLine,
  CartLineUpdateInput,
  ComponentizableCartLine,
} from '@shopify/hydrogen/storefront-api-types';
import {Image} from '@shopify/hydrogen-react';
import clsx from 'clsx';
import {useContext} from 'react';

import {useCartFetchers} from '~/hooks/useCartFetchers';
import MoveToWishlistButton from '~/lib/swym/components/wishlist/MoveToWishlistButton';
import {GlobalContext, returnLineItemSubtotal} from '~/lib/utils';

import Currency from '../global/Currency';
import SpinnerIcon from '../icons/Spinner';
import {Link} from '../Link';
import AttributesUpdateForm from './AttributesFormUpdate';
import CartItemQuantity from './CartItemQuantity';
import ItemRemoveButton from './ItemRemoveButton';

export default function LineItemCart({
  lineItem,
  cart,
}: {
  lineItem: CartLine | ComponentizableCartLine;
  cart?: Cart;
}) {
  const {merchandise} = lineItem;

  const updatingItems = useCartFetchers(CartForm.ACTIONS.LinesUpdate);
  const removingItems = useCartFetchers(CartForm.ACTIONS.LinesRemove);
  const {locale} = useContext(GlobalContext);

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
  const subTotal = returnLineItemSubtotal(lineItem);

  return (
    <div
      role="row"
      className={clsx(
        'flex border-collapse flex-wrap items-start border-b border-t border-lightGray py-5 last:border-b-0 md:flex-row md:items-center',
        deleting && 'opacity-50',
      )}
    >
      {/* Image */}
      <div role="cell" className="mr-4 flex-shrink-0 self-start">
        {merchandise.image && (
          <Link to={`/products/${merchandise.product.handle}`}>
            <Image
              className=""
              data={merchandise.image}
              width={80}
              height={116}
              alt={merchandise.title}
            />
          </Link>
        )}
      </div>

      {/* Title */}
      <div
        role="cell"
        className="flex-grow-1 table-style relative mr-4 flex flex-col items-center gap-[10px] text-primary md:mr-0 md:flex-row md:self-start"
      >
        <div className="title-box flex flex-col md:self-start">
          <Link
            to={`/products/${merchandise.product.handle}`}
            className="max-w-[14rem] text-sm hover:underline sm:max-w-full"
          >
            {merchandise.product.title}
          </Link>

          {/* Options */}
          {!hasDefaultVariantOnly && (
            <ul className="mt-1 space-y-1 text-xs text-primary">
              {merchandise.selectedOptions.map(({name, value}) => (
                <li key={name}>
                  <span className="font-bold">{name} — </span>
                  <span className="font-normal">{value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Price */}
        <div className="price-element absolute bottom-0 right-0 mb-3 ml-4 flex min-w-[4rem] justify-end self-start text-sm leading-none md:self-center md:pb-0">
          {updating ? (
            <SpinnerIcon width={24} height={24} />
          ) : (
            <Currency data={lineItem.merchandise.price} />
          )}
        </div>

        {/* Quantity */}
        <div className="self-start md:self-center">
          <CartItemQuantity line={lineItem} submissionQuantity={updating} />
        </div>

        {/* Subtotal */}
        <div className="subtotal-element-desktop hidden min-w-[4rem] self-center justify-self-end text-sm leading-none md:flex">
          {updating ? (
            <SpinnerIcon width={24} height={24} />
          ) : (
            <div className="items-between flex">
              <p className="md:hidden">Subtotal</p>
              <Currency data={subTotal} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-row items-center gap-1">
        <MoveToWishlistButton
          lineIds={[lineItem.id]}
          lineItem={lineItem}
        ></MoveToWishlistButton>
        <div className="h-4 w-px text-otherGray">|</div>
        <ItemRemoveButton lineIds={[lineItem.id]} lineItem={lineItem} />
      </div>
      <div role="cell" className="flex w-full flex-col gap-[10px]">
        {locale.country === 'US' && (
          <AttributesUpdateForm
            lineItem={lineItem}
            quantity={lineItem.quantity}
            cart={cart}
          />
        )}
      </div>
      <div
        role="cell"
        className="subtotal-element-mobile flex w-full flex-row md:hidden"
      >
        <div className="subtotal-element flex w-full min-w-[4rem] justify-between pb-[15px] pt-5 text-xs leading-none">
          {updating ? (
            <SpinnerIcon width={24} height={24} />
          ) : (
            <div className="flex w-full justify-between border-t border-lightGray pt-5">
              <p className="md:hidden">Subtotal</p>
              <div className="flex">
                <Currency data={subTotal} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
