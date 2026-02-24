import {CartCost as CartCostType} from '@shopify/hydrogen/storefront-api-types';
import {useContext} from 'react';

import {GlobalContext} from '~/lib/utils';

import Currency from '../global/Currency';
import FreeShippingProgress from './FreeShippingProgress';

export function CartSummary({cost}: {cost: CartCostType}) {
  const {locale} = useContext(GlobalContext);
  return (
    <div
      role="table"
      aria-label="Cost summary"
      className="py[35px] px-[30px] text-sm"
    >
      <div className="flex flex-col justify-between text-primary" role="row">
        <span className="" role="rowheader">
          <h3>Order Summary</h3>
        </span>
        {locale.country === 'US' && (
          <FreeShippingProgress
            orderTotal={parseFloat(cost?.subtotalAmount?.amount)}
          />
        )}
      </div>
      <div
        className="flex justify-between border-t border-gray pt-4 text-primary"
        role="row"
      >
        <span className="" role="rowheader">
          Subtotal:
        </span>
        <span role="cell" className="flex text-right">
          {cost?.subtotalAmount?.amount ? (
            <Currency data={cost?.subtotalAmount} />
          ) : (
            '-'
          )}
        </span>
      </div>

      <div role="row" className="flex justify-between gap-2 py-4 text-primary">
        <span className="" role="rowheader">
          Shipping
        </span>
        <span role="cell" className="text-right text-sm">
          Calculated at checkout
        </span>
      </div>

      <div
        role="row"
        className="flex justify-between gap-2 border-b border-gray pb-4 text-primary"
      >
        <span className="" role="rowheader">
          Tax
        </span>
        <span role="cell" className="text-right text-sm">
          Calculated at checkout
        </span>
      </div>

      <div
        className="flex justify-between border-t border-gray pb-8 pt-6 text-md font-bold text-primary"
        role="row"
      >
        <span className="" role="rowheader">
          Total:
        </span>
        <span role="cell" className="flex text-right">
          {cost?.subtotalAmount?.amount ? (
            <Currency data={cost?.subtotalAmount} />
          ) : (
            '-'
          )}
        </span>
      </div>
    </div>
  );
}

export function MiniCartSummary({cost}: {cost: CartCostType}) {
  return (
    <>
      <div role="table" aria-label="Cost summary" className="text-sm">
        <div className="flex justify-between" role="row">
          <span className="font-bold text-darkGray" role="rowheader">
            Total Order
          </span>
          <span role="cell" className="flex text-right font-bold">
            {cost?.subtotalAmount?.amount ? (
              <Currency data={cost?.subtotalAmount} />
            ) : (
              '-'
            )}
          </span>
        </div>

        <div role="row" className="flex justify-between">
          <span className="py-1 text-2xs text-otherGray" role="rowheader">
            Taxes & Shipping Calculated at checkout
          </span>
        </div>
      </div>
    </>
  );
}
