import {CartForm} from '@shopify/hydrogen';
import {CartLine} from '@shopify/hydrogen/storefront-api-types';
import {useContext} from 'react';

import {GlobalContext} from '~/lib/utils';
import {pushRemoveFromCart} from '~/utils/eventTracking';
import {pushRemoveFromCartNew} from '~/utils/gtmEvents'; //PEAK ACTIVITY ADDITION

import CartDrawerCloseIcon from '../icons/CartDrawerClose';

export default function ItemRemoveButton({
  lineIds,
  lineItem,
}: {
  lineIds: CartLine['id'][];
  lineItem: any;
}) {
  const {eventTrackingData, locale} = useContext(GlobalContext);

  return (
    <CartForm
      route={`${locale.pathPrefix}/cart`}
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button
        className="remove-text disabled:pointer-events-all text-link px-[10px] py-[6px] pr-2 text-3xs text-xs underline disabled:cursor-wait disabled:opacity-50 md:float-right"
        type="submit"
        aria-label="Remove item from cart"
        onClick={() => {
          pushRemoveFromCart(
            lineItem,
            eventTrackingData.customer,
            eventTrackingData.currency,
          );
          //PEAK ACTIVITY ADDITIONS STARTS
          pushRemoveFromCartNew(
            lineItem,
            eventTrackingData.customer,
            eventTrackingData.currency,
            'remove', // Pass 'remove' context for the remove button
          );
          //PEAK ACTIVITY ADDITIONS ENDS
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pushRemoveFromCart(
              lineItem,
              eventTrackingData.customer,
              eventTrackingData.currency,
            );
            //PEAK ACTIVITY ADDITIONS STARTS
            pushRemoveFromCartNew(
              lineItem,
              eventTrackingData.customer,
              eventTrackingData.currency,
            );
            //PEAK ACTIVITY ADDITIONS ENDS
          }
        }}
      >
        Remove
      </button>
    </CartForm>
  );
}
