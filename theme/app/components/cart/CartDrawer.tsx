import {Dialog, Transition} from '@headlessui/react';
import {Await, useLocation, useMatches} from '@remix-run/react';
import {ShopPayButton} from '@shopify/hydrogen';
import type {Cart} from '@shopify/hydrogen/storefront-api-types';
import {CartProvider, flattenConnection} from '@shopify/hydrogen-react';
import clsx from 'clsx';
import {
  Fragment,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import Button, {squareButtonStyles} from '~/components/elements/Button';
import {GlobalContext} from '~/lib/utils';
import {pushViewCart} from '~/utils/eventTracking';
import {pushViewCartNew} from '~/utils/gtmEvents'; //PEAK ACTIVITY ADDITION

import CartDrawerCloseIcon from '../icons/CartDrawerClose';
import {Link} from '../Link';
import BestSellers from './BestSellers';
import {MiniCartActions} from './CartActions';
import {MiniCartLineItems} from './CartLineItems';
import {MiniCartSummary} from './CartSummary';
import CompleteTheSet from './CompleteTheSet';
import FreeShippingProgress from './FreeShippingProgress';
/**
 * A Drawer component that opens on user click.
 * @param open - Boolean state. If `true`, then the drawer opens.
 * @param onClose - Function should set the open state.
 * @param children - React children node.
 */

function CartDrawer({
  fallbackPodId,
  open,
  onClose,
}: {
  fallbackPodId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [root] = useMatches();
  const {eventTrackingData} = useContext(GlobalContext);
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const {locale} = useContext(GlobalContext);

  useEffect(() => {
    if (open) {
      pushViewCart(
        eventTrackingData.cart,
        eventTrackingData.customer,
        eventTrackingData.currency,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  //PEAK ACTIVITY ADDITIONS STARTS
  useEffect(() => {
    if (open) {
      pushViewCartNew(
        eventTrackingData.cart,
        eventTrackingData.customer,
        eventTrackingData.currency,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  //PEAK ACTIVITY ADDITIONS ENDS

  //close drawer if it's redirected to a new product page
  useEffect(() => {
    const isProductPage = /^\/([a-z]{2}-[a-z]{2}\/)?products\/.+/.test(
      location.pathname,
    );
    const hasChanged = prevPath.current !== location.pathname;

    if (open && isProductPage && hasChanged) {
      onClose();
    }

    prevPath.current = location.pathname;
  }, [location.pathname, open, onClose]);

  return (
    <Suspense>
      <Await resolve={root.data?.cart}>
        {(cart) => (
          <CartProvider data={cart}>
            <Transition appear show={open} as={Fragment}>
              <Dialog as="div" className="relative z-[200]" onClose={onClose}>
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-500"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-500"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-40 bg-black bg-opacity-20"
                  />
                </Transition.Child>

                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="ease-in-out duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel
                    className={clsx(
                      'cart-drawer fixed bottom-0 left-0 right-0 top-0 z-40 flex h-full w-full flex-col overflow-y-auto bg-white px-6 md:bottom-auto md:left-auto md:w-[354px]',
                    )}
                  >
                    <CartHeader onClose={onClose} />

                    {cart?.totalQuantity > 0 ? (
                      <>
                        {locale.country === 'US' && (
                          <FreeShippingProgress
                            orderTotal={parseFloat(
                              cart.cost.totalAmount.amount,
                            )}
                          />
                        )}
                        <MiniCartLineItems linesObj={cart.lines} open={open} />
                        <CompleteTheSet linesObj={cart.lines} />
                        {root.data.layout.cartDrawerPod ? (
                          <CartFooter
                            cart={cart}
                            onClose={onClose}
                            pod={root.data.layout.cartDrawerPod[0]}
                            fallbackPodId={fallbackPodId}
                          />
                        ) : (
                          <CartFooter cart={cart} onClose={onClose} />
                        )}
                      </>
                    ) : (
                      <CartEmpty
                        onClose={onClose}
                        pod={root.data.layout.cartDrawerPod[0]}
                        fallbackPodId={fallbackPodId}
                      />
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </Dialog>
            </Transition>
          </CartProvider>
        )}
      </Await>
    </Suspense>
  );
}

/* Use for associating arialabelledby with the title*/
CartDrawer.Title = Dialog.Title;

export {CartDrawer};

export function useDrawer(openDefault = false) {
  const [isOpen, setIsOpen] = useState(openDefault);
  const [canRender, setCanRender] = useState(false);

  function openDrawer() {
    setCanRender(true);
    setTimeout(() => setIsOpen(true));
  }

  function closeDrawer() {
    setIsOpen(false);
  }

  return {
    isOpen,
    openDrawer,
    closeDrawer,
    canRender,
  };
}

function CartHeader({onClose}: {onClose: () => void}) {
  return (
    <header
      className={clsx(
        'sticky top-0 z-10 flex items-center justify-between border-b border-lightGray bg-white',
      )}
    >
      <div className="leading-normal pb-[6px] pt-[26px] font-hoefler text-xl">
        Shopping Bag
      </div>
      <button type="button" onClick={onClose}>
        <CartDrawerCloseIcon />
      </button>
    </header>
  );
}

function CartFooter({
  cart,
  onClose,
  pod,
  fallbackPodId,
}: {
  cart: Cart;
  onClose: () => void;
  pod?: any;
  fallbackPodId?: string;
}) {
  const {locale} = useContext(GlobalContext);
  const [root] = useMatches();
  const storeDomain = root?.data?.storeDomain;
  const cartTotal = parseFloat(cart.cost.totalAmount.amount);
  const freeShippingThreshold = parseFloat(150);
  const amountNeededForFreeShip = parseFloat(freeShippingThreshold) - cartTotal;
  const FREE_MESSAGE = 'Your shipping is free!';
  const moreForFreeShipping = `Spend $${amountNeededForFreeShip.toFixed(
    2,
  )} more and get FREE Shipping`;

  const cartItemIds = [];
  if (!pod.pod.itemID) {
    cart.lines.edges.forEach(function (el: any, index: number) {
      cartItemIds.push(el.node.merchandise.product.id.split('/Product/')[1]);
    });
  }

  const shopPayLineItems = flattenConnection(cart.lines).map((line) => ({
    id: line.merchandise.id,
    quantity: line.quantity,
  }));

  return (
    <footer className="bg-white pb-4">
      <div className="relative flex flex-col py-4">
        <MiniCartSummary cost={cart.cost} />

        <div className="py-4">
          <MiniCartActions cart={cart} />
        </div>
        <Link
          to={'/cart'}
          className={clsx([
            squareButtonStyles({mode: 'outline', tone: 'default'}),
            '',
          ])}
          onClick={onClose}
          type="button"
          prefetch="intent"
        >
          View Shopping Bag
        </Link>
      </div>
      {locale.country === 'US' && (
        <div className="flex flex-col">
          <div className="shop-pay-wrapper">
            <ShopPayButton
              className={clsx([
                squareButtonStyles({tone: 'shopPay'}),
                'w-full',
              ])}
              variantIdsAndQuantities={shopPayLineItems}
              storeDomain={storeDomain}
            />
          </div>
          <p className="py-1 text-2xs text-otherBlack">
            {cartTotal > freeShippingThreshold
              ? FREE_MESSAGE
              : moreForFreeShipping}
          </p>
          <p className="py-1 text-2xs text-otherBlack">
            Free Returns In Store (for US Orders)
          </p>
        </div>
      )}
      {cart && cart.lines?.edges.length > 0 && (
        <>
          <BestSellers
            pod={pod}
            itemIDs={pod.pod.itemIDs ? pod.pod.itemIDs : cartItemIds}
            fallbackPodId={fallbackPodId}
          />
        </>
      )}
    </footer>
  );
}

function CartEmpty({
  fallbackPodId,
  pod,
  onClose,
}: {
  fallbackPodId: string;
  pod: any;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col pt-6">
      <p className="mb-4 text-sm">Your bag is empty.</p>
      <Button
        className={clsx([
          squareButtonStyles({mode: 'default', tone: 'default'}),
          'w-full',
        ])}
        onClick={onClose}
        type="button"
      >
        Continue Shopping
      </Button>
      <BestSellers pod={pod} fallbackPodId={fallbackPodId} />
    </div>
  );
}
