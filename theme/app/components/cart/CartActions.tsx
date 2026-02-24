import {useMatches} from '@remix-run/react';
import {flattenConnection, ShopPayButton} from '@shopify/hydrogen';
import {Cart} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import {useContext} from 'react';

import {GlobalContext} from '~/lib/utils';

import Button, {squareButtonStyles} from '../elements/Button';

export function CartActions({cart, ipData}: {cart: Cart; ipData: any}) {
  const [root] = useMatches();
  const {locale} = useContext(GlobalContext);
  if (!cart || !cart.checkoutUrl) return null;

  const storeDomain = root?.data?.storeDomain;

  const shopPayLineItems = flattenConnection(cart.lines).map((line) => ({
    id: line.merchandise.id,
    quantity: line.quantity,
  }));

  if (!shopPayLineItems.length) return null;

  return (
    <div className="flex w-full flex-row flex-wrap gap-3">
      <Button
        to={cart.checkoutUrl}
        className={clsx([
          squareButtonStyles({mode: 'default', tone: 'default'}),
          'w-full',
        ])}
      >
        Checkout Now
      </Button>
      {locale.country === 'US' && (
        <ShopPayButton
          className={clsx([squareButtonStyles({tone: 'shopPay'}), 'w-full'])}
          variantIdsAndQuantities={shopPayLineItems}
          storeDomain={storeDomain}
        />
      )}
    </div>
  );
}

export function MiniCartActions({cart}: {cart: Cart}) {
  const [root] = useMatches();

  if (!cart || !cart.checkoutUrl) return null;

  // const storeDomain = root?.data?.storeDomain;

  const shopPayLineItems = flattenConnection(cart.lines).map((line) => ({
    id: line.merchandise.id,
    quantity: line.quantity,
  }));

  return (
    <div className="flex-column w-full gap-3">
      <Button
        to={cart.checkoutUrl}
        className={clsx([
          squareButtonStyles({mode: 'default', tone: 'default'}),
          'w-full',
        ])}
      >
        Checkout Now
      </Button>
    </div>
  );
}
