import {
  CartLine,
  ComponentizableCartLine,
} from '@shopify/hydrogen/storefront-api-types';
import {useContext} from 'react';

import {GlobalContext} from '~/lib/utils';
//PEAK ACTIVITY ADDITIONS STARTS
import {pushAddToCartIncrease, pushRemoveCartDecrease} from '~/utils/gtmEvents';

import MinusCircleIcon from '../icons/MinusCircle';
import PlusCircleIcon from '../icons/PlusCircle';
import UpdateCartButton from './UpdateCartButton';
//PEAK ACTIVITY ADDITIONS END

export default function CartItemQuantity({
  line,
  submissionQuantity,
}: {
  line: CartLine | ComponentizableCartLine;
  submissionQuantity: number | undefined;
}) {
  //PEAK ACTIViTY ADDITION STARTS
  const {eventTrackingData} = useContext(GlobalContext);
  //PEAK ACTIViTY ADDITION ENDS

  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity} = line;

  // // The below handles optimistic updates for the quantity
  const lineQuantity = submissionQuantity ? submissionQuantity : quantity;

  const prevQuantity = Number(Math.max(0, lineQuantity - 1).toFixed(0));
  const nextQuantity = Number((lineQuantity + 1).toFixed(0));
  const attributeInputs = line.attributes.map((attribute) => ({
    key: attribute.key,
    value: attribute.value || '', // ensure value is a string, not undefined
  }));

  return (
    <div className="flex h-10 items-center gap-2 border border-gray px-1">
      <UpdateCartButton
        lines={[
          {id: lineId, quantity: prevQuantity, attributes: attributeInputs},
        ]}
      >
        <button
          aria-label="Decrease quantity"
          value={prevQuantity}
          onClick={() => {
            // PEAK ACTIVITY ADDITION TO Trigger the pushRemoveFromCartNew event
            if (lineQuantity > 1) {
              pushRemoveCartDecrease(
                line,
                1, // Removing a single unit
                eventTrackingData.customer,
                eventTrackingData.currency,
                'decrease', // Pass 'decrease' context for the minus button
              );
            }
          }}
          // PEAK ACTIVITY ADDITION ENDS
        >
          <MinusCircleIcon />
        </button>
      </UpdateCartButton>

      <div className="min-w-[1rem] text-center text-xs font-bold leading-none text-black">
        {lineQuantity}
      </div>

      <UpdateCartButton
        lines={[
          {id: lineId, quantity: nextQuantity, attributes: attributeInputs},
        ]}
      >
        <button
          aria-label="Increase quantity"
          value={prevQuantity}
          // PEAK ACTIVITY ADDITION TO Trigger the pushAddToCartNew event
          onClick={() => {
            pushAddToCartIncrease(
              line,
              1, // Adding a single unit
              eventTrackingData.customer,
              eventTrackingData.currency,
              'Increase Quantity', // Pass 'Increase Quantity' context
            );
          }}
          // PEAK ACTIVITY ADDITION Ends
        >
          <PlusCircleIcon />
        </button>
      </UpdateCartButton>
    </div>
  );
}
