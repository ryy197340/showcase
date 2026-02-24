import {useContext, useEffect, useRef, useState} from 'react';

import {PodSlider as PodSliderType} from '~/lib/sanity';
import WishlistCarousel from '~/lib/swym/components/wishlist/WishlistCarousel';
import {GlobalContext} from '~/lib/utils';

import {Link} from '../Link';
import PodSlider from '../modules/PodSlider';
import AttributesUpdateForm from './AttributesFormUpdate';
import {CartActions} from './CartActions';
import {CartLineItems} from './CartLineItems';
import {CartSummary} from './CartSummary';

type Props = {
  cart: any;
  product: any;
  cartPods?: PodSliderType[];
  ipData: any;
  fallbackPodId?: string;
};

export default function CartContents({
  cart,
  product,
  cartPods,
  ipData,
  fallbackPodId,
}: Props) {
  const [showStickyActions, setShowStickyActions] = useState(false);
  const [giftOptions, setGiftOptions] = useState({
    to: '',
    from: '',
    message: '',
  });

  const cartActionsRef = useRef(null); // Ref for the original CartActions container
  const {locale} = useContext(GlobalContext);

  useEffect(() => {
    try {
      if (cart && cartActionsRef.current) {
        const observerCallback = (entries: IntersectionObserverEntry[]) => {
          const [entry] = entries;
          // If the original CartActions is not in the viewport and we are on mobile, show the sticky CartActions
          setShowStickyActions(!entry.isIntersecting);
        };

        const observerOptions = {
          root: null, // viewport
          threshold: 0.1, // 10% visibility
        };

        const observer = new IntersectionObserver(
          observerCallback,
          observerOptions,
        );

        // Only observe if on a mobile device
        if (window.innerWidth < 768 && cartActionsRef.current) {
          observer.observe(cartActionsRef.current);
        }

        return () => observer.disconnect(); // Cleanup observer on unmount
      }
    } catch (error) {
      console.error('Error observing CartActions', error);
    }
  }, [cart]);

  return (
    <>
      <div className="flex w-full flex-col items-center gap-[15px]">
        <div className="flex flex-row gap-[10px] text-xs">
          <span className="flex gap-[10px] text-otherGray">
            <Link to={'/'} prefetch="intent">
              Home
            </Link>
            |
          </span>
          Shopping Bag
        </div>
        <h1 className="h1 text-xl2">Shopping Bag</h1>
        <p className="text-sm text-primary md:hidden">
          {`${
            cart && cart._data?.lines
              ? '(' + cart._data?.lines?.edges.length + ') Items'
              : ''
          }`}
        </p>
      </div>
      {cart && cart.lines?.edges?.length > 0 && (
        <div className="mx-auto grid w-full max-w-6xl gap-8 pb-12 md:grid-cols-3 md:items-start md:gap-8 lg:gap-12">
          <div className="cart-template flex-grow border-collapse md:col-span-2 md:translate-y-4">
            <CartLineItems linesObj={cart.lines} cart={cart} ipData={ipData} />
          </div>
          <div className="flex-grow border-collapse border border-gray py-[35px] md:col-span-1 md:translate-y-4">
            <CartSummary cost={cart.cost} />
            <div className="px-[30px]" ref={cartActionsRef}>
              <CartActions cart={cart} ipData={ipData} />
            </div>
          </div>
          {showStickyActions && window.innerWidth < 768 && (
            <div className="fixed bottom-0 left-0 right-0 z-10 grid w-full gap-6 bg-white p-4 md:sticky md:top-[65px] md:hidden md:translate-y-4 md:px-6">
              <CartActions cart={cart} ipData={ipData} />
            </div>
          )}
          <div className="cart-template flex-grow border-collapse md:col-span-2 md:translate-y-4">
            {locale.country === 'US' && (
              <AttributesUpdateForm
                attributes={{key: '_ItemGiftMessage', value: giftOptions}}
                source="order"
                lines={cart.lines}
                cart={cart}
              />
            )}
          </div>
        </div>
      )}
      {cart && cart.lines?.edges?.length === 0 && (
        <div className="flex w-full flex-row justify-center pt-20">
          <span className="h1 text-center">Your shopping bag is empty</span>
        </div>
      )}
      <div className="mx-auto grid w-full max-w-6xl pb-12 md:grid-cols-3 md:items-start">
        <div className="cart-template w-full-40 flex-grow border-collapse md:col-span-2 md:w-full">
          <div className="p-0">
            <h2 className="font-normal font-primary text-base block min-h-10 pb-6 pt-10 text-xl">
              My Wishlist
            </h2>
            <WishlistCarousel />
          </div>
        </div>
      </div>
      {cartPods &&
        cartPods.map((cartPod, index) => {
          const cartItemIds = [];
          cart?.lines?.edges?.forEach(function (el: any, index: number) {
            cartItemIds.push(
              el.node.merchandise.product.id.split('/Product/')[1],
            );
          });
          cartPod.cartItemsIDs = cartItemIds;
          cartPod.pod.cartItemsIDs = cartItemIds;

          return (
            <PodSlider
              module={cartPod}
              key={cartPod._key}
              isCart={!product} // if !product, assume this is a cart
              cartIsEmpty={cart?.lines?.edges?.length === 0} // dynamically populate this boolean
              fallbackPodId={fallbackPodId}
            />
          );
        })}
    </>
  );
}
