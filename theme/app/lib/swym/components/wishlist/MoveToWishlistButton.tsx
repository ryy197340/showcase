import {CartForm} from '@shopify/hydrogen';
import {CartLine} from '@shopify/hydrogen/storefront-api-types';
import {useContext, useRef, useState} from 'react';
import React from 'react';

import {useSwymContext} from '~/lib/swym/context/SwymContext';
import {GlobalContext} from '~/lib/utils';
import {pushRemoveFromCart} from '~/utils/eventTracking';
import {pushRemoveFromCartNew} from '~/utils/gtmEvents';

interface MoveToWishlistButtonProps {
  lineItem: any;
  lineIds: CartLine['id'][];
}

export default function MoveToWishlistButton({
  lineItem,
  lineIds,
}: MoveToWishlistButtonProps) {
  const {moveToWishlist} = useSwymContext();
  const {eventTrackingData, locale} = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const merchandise = lineItem.merchandise;
  const productId = parseInt(merchandise.product.id.split('Product/')[1], 10);
  const variantId = parseInt(merchandise.id.split('ProductVariant/')[1], 10);
  const productUrl = `${window.location.origin}/products/${merchandise.product.handle}`;

  // Ref to the hidden CartForm submit button
  const removeBtnRef = useRef<HTMLButtonElement>(null);

  const handleMoveToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the moveToWishlist function from context
      await moveToWishlist(productId, variantId, productUrl);

      // Track event and remove from cart
      pushRemoveFromCart(
        lineItem,
        eventTrackingData.customer,
        eventTrackingData.currency,
      );
      pushRemoveFromCartNew(
        lineItem,
        eventTrackingData.customer,
        eventTrackingData.currency,
        'remove',
      );

      // Programmatically submit the CartForm to remove from cart
      if (removeBtnRef.current) {
        removeBtnRef.current.click();
      }
    } catch (error) {
      console.error('Error moving item to wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="text-link text-xs underline disabled:opacity-50"
        style={{color: '#223A5F'}}
        onClick={handleMoveToWishlist}
        disabled={loading}
        type="button"
      >
        Move to Wishlist
      </button>
      {/* Hidden CartForm to remove from cart, mimics ItemRemoveButton */}
      <CartForm
        route={`${locale.pathPrefix}/cart`}
        action={CartForm.ACTIONS.LinesRemove}
        inputs={{lineIds}}
      >
        <button
          ref={removeBtnRef}
          type="submit"
          style={{display: 'none'}}
          aria-hidden="true"
        >
          Remove
        </button>
      </CartForm>
    </>
  );
}
