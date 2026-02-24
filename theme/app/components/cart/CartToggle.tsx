import {Await} from '@remix-run/react';
import {Cart} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import {Suspense} from 'react';

import CircleOutlineButton from '~/components/elements/CircleOutlineButton';

import {ShoppingCart} from '../icons/ShoppingCart';

type Props = {
  cart: Cart;
  isOpen: boolean;
  openDrawer: () => void;
};

/**
 * A client component that defines the behavior when a user toggles a cart
 */
export default function CartToggle({cart, isOpen, openDrawer}: Props) {
  return (
    <Suspense fallback={<CircleOutlineButton>0</CircleOutlineButton>}>
      <Await resolve={cart}>
        {(data) => (
          <CircleOutlineButton
            aria-expanded={isOpen}
            aria-controls="cart"
            onClick={openDrawer}
            id="cartIcon"
          >
            <ShoppingCart />
            <span
              className={clsx(
                'absolute -right-[7px] -top-[5px] flex aspect-square w-[16px] place-content-center items-center rounded-full border border-secondary bg-secondary fill-secondary pt-px  text-2xs font-bold leading-none tracking-normal text-white duration-200',
                'hover:border-opacity-50',
                `${data?.totalQuantity > 0 ? '' : 'hidden'}`,
              )}
            >
              {data?.totalQuantity || 0}
            </span>
          </CircleOutlineButton>
        )}
      </Await>
    </Suspense>
  );
}
