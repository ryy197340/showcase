import {Await, useLoaderData, useMatches} from '@remix-run/react';
import {
  CartForm,
  type CartQueryData,
  type SeoHandleFunction,
} from '@shopify/hydrogen';
import {CartProvider} from '@shopify/hydrogen-react';
import {AttributeInput} from '@shopify/hydrogen-react/storefront-api-types';
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import clsx from 'clsx';
import {useContext, useEffect, useState} from 'react';
import {Suspense} from 'react';
import invariant from 'tiny-invariant';

import CartContents from '~/components/cart/CartContents';
import SpinnerIcon from '~/components/icons/Spinner';
import {GlobalContext, isLocalPath} from '~/lib/utils';
import {PRODUCT_QUERY} from '~/queries/shopify/product';
import {pushViewCart} from '~/utils/eventTracking';
import {pushViewCartNew} from '~/utils/gtmEvents'; //PEAK ACTIVITY ADDITIONS STARTS
import {fetchAptosQtyBulk} from '~/utils/product';

export async function loader({context, request}: LoaderFunctionArgs) {
  const {cart, ipData, env} = context;
  const result = await cart.get();
  // fetch aptosQty for all of the variants in the product, so that we have them on variant change
  const skus: Array<string | undefined> = [];
  result?.lines.edges.forEach((edge: any) =>
    skus.push(edge.node.merchandise.sku),
  );
  await fetchAptosQtyBulk(skus, env, context);

  if (!result || result.lines.edges.length <= 0) {
    return json({product: null, ipData});
  }

  const handle = result?.lines.edges[0].node.merchandise.product.handle;
  const selectedOptions =
    result?.lines.edges[0].node.merchandise.selectedOptions;
  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {
      handle,
      selectedOptions,
    },
  });
  return json({product, ipData});
}

const seo: SeoHandleFunction = () => ({
  title: 'Cart',
  noIndex: true,
});

export const handle = {
  seo,
};

export async function action({request, context}: ActionFunctionArgs) {
  const {session, cart} = context;

  const [formData, customerAccessToken] = await Promise.all([
    request.formData(),
    session.get('customerAccessToken'),
  ]);

  const {action, inputs} = CartForm.getFormInput(formData);

  invariant(action, 'No cartAction defined');

  let status = 200;
  let result: CartQueryData;

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = (
        formDiscountCode ? [formDiscountCode] : []
      ) as string[];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      //PEAK ACTIVITY ADDITIONS STARTS Store the discount codes in localStorage
      if (discountCodes.length > 0) {
        localStorage.setItem(
          'appliedDiscountCodes',
          JSON.stringify(discountCodes),
        );
      }
      //PEAK ACTIVITY ADDITIONS ENDS
      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate:
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
        customerAccessToken,
      });
      break;
    case CartForm.ACTIONS.AttributesUpdateInput: {
      // Add condition to handle Gorgias info, and add it as a cart attribute
      if (inputs.gorgiasInfo) {
        const guestId = inputs.gorgiasInfo['gorgias.guestId'];
        const sessionId = inputs.gorgiasInfo['gorgias.sessionId'];
        const currentCart = await cart.get();
        const currentAttributes = currentCart?.attributes;
        currentAttributes?.push({
          key: 'gorgias.guestId',
          value: guestId,
        });
        currentAttributes?.push({
          key: 'gorgias.sessionId',
          value: sessionId,
        });
        result = await cart.updateAttributes(currentAttributes);
        break;
      }
      // Pre-existing logic for gift wrapping
      // If there's a lineId -- The update is for individual line items
      else if (inputs.lineId) {
        let attributes: {key: string; value: string}[] = [];
        const orderAttributes: {key: string; value: string}[] = [];
        if (
          inputs.giftWrapRemove === 'removed' ||
          inputs.removed === 'removed'
        ) {
          // Remove line item attributes
          attributes = [];
        } else {
          // Set line item attributes
          if (
            inputs.to.length > 0 ||
            inputs.from.length > 0 ||
            inputs.message.length > 0
          ) {
            // There is a message value - set line gift wrapping to true, set gift message value
            attributes = [
              {
                key: '_ItemGiftWrap',
                value: 'true',
              },
              {
                key: '_ItemGiftMessage',
                value: `${
                  inputs.to.length > 0 ||
                  inputs.from.length > 0 ||
                  inputs.message.length > 0
                    ? `GW:C TO:${inputs.to}, FROM:${inputs.from}, MSG:${inputs.message}`
                    : ''
                }`,
              },
            ];
          } else {
            // There is no message, so only set gift wrapping to true
            attributes = [
              {
                key: '_ItemGiftWrap',
                value: 'true',
              },
            ];
          }
        }

        const product = {
          id: inputs.lineId,
          quantity: parseInt(inputs.quantity),
          attributes,
        };

        result = await cart.updateLines([product]);
        await cart.updateAttributes(orderAttributes);
      } else {
        // otherwise, do order level attributes & line item attributes
        let currentAttributes: AttributeInput[] = [];
        let lineAttributes: AttributeInput[] = [];
        if (
          inputs.giftWrapRemove === 'removed' ||
          inputs.removed === 'removed'
        ) {
          // remove attributes - line items
          const products = [];
          if (typeof inputs.orderLineId === 'string') {
            const product = {
              id: inputs.orderLineId,
              quantity: parseInt(inputs.orderLineQuantity),
              attributes: lineAttributes,
            };
            products.push(product);
          } else {
            for (let i = 0; i < inputs?.orderLineId?.length; i++) {
              const product = {
                id: inputs.orderLineId[i],
                quantity: parseInt(inputs.orderLineQuantity[i]),
                attributes: lineAttributes,
              };
              products.push(product);
            }
          }
          result = await cart.updateLines(products);
          // submit line item attributes
        } else {
          //set order level attributes
          const currentCart = await cart.get();
          currentAttributes = currentCart.attributes;
          if (
            inputs.to.length > 0 ||
            inputs.from.length > 0 ||
            inputs.message.length > 0
          ) {
            currentAttributes.push({
              key: '_OrderGiftWrapping',
              value: 'true',
            });
            currentAttributes.push({
              key: '_OrderGiftWrappingMessage',
              value: `GW:C TO:${inputs.to}, FROM:${inputs.from}, MSG:${inputs.message}`,
            });
            lineAttributes = [
              {
                key: '_ItemGiftWrap',
                value: 'true',
              },
              {
                key: '_ItemGiftMessage',
                value: `GW:C TO:${inputs.to}, FROM:${inputs.from}, MSG:${inputs.message}`,
              },
            ];
          } else {
            currentAttributes.push({
              key: '_OrderGiftWrapping',
              value: 'true',
            });
            lineAttributes = [
              {
                key: '_ItemGiftWrap',
                value: 'true',
              },
            ];
          }
          if (inputs.orderLineId) {
            const products = [];
            if (typeof inputs.orderLineId === 'string') {
              const product = {
                id: inputs.orderLineId,
                quantity: parseInt(inputs.orderLineQuantity),
                attributes: lineAttributes,
              };
              products.push(product);
              result = await cart.updateLines([product]);
            } else {
              for (let i = 0; i < inputs.orderLineId.length; i++) {
                const product = {
                  id: inputs.orderLineId[i],
                  quantity: parseInt(inputs.orderLineQuantity[i]),
                  attributes: lineAttributes,
                };
                products.push(product);
              }
              result = await cart.updateLines(products);
            }
            // submit line item attributes
          }
        }
        // submit order level attributes
        result = await cart.updateAttributes(currentAttributes);
      }
      break;
    }
    default:
      invariant(false, `${action} cart action is not defined`);
  }

  /**
   * The Cart ID may change after each mutation. We need to update it each time in the session.
   */
  const cartId = result.cart.id;
  const headers = cart.setCartId(result.cart.id);

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string' && isLocalPath(request, redirectTo)) {
    status = 303;
    headers.set('Location', redirectTo);
  }

  const {cart: cartResult, errors} = result;

  const currentCart = await cart.get();
  return json(
    {
      cart: cartResult,
      errors,
      analytics: {
        cartId,
        cart: currentCart,
      },
    },
    {status, headers},
  );
}

export default function Cart() {
  const [root] = useMatches();
  const {cartPods} = root.data?.layout ?? {};
  const {product, ipData} = useLoaderData();
  const [giftOptions, setGiftOptions] = useState({
    to: '',
    from: '',
    message: '',
  });

  const {eventTrackingData} = useContext(GlobalContext);

  useEffect(() => {
    pushViewCart(
      eventTrackingData.cart,
      eventTrackingData.customer,
      eventTrackingData.currency,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //PEAK ACTIVITY ADDITIONS STARTS
  useEffect(() => {
    pushViewCartNew(
      eventTrackingData.cart,
      eventTrackingData.customer,
      eventTrackingData.currency,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  //PEAK ACTIVITY ADDITIONS ENDS
  return (
    <section className={clsx('px-4 pb-4 pt-8', 'md:px-8 md:pb-8')}>
      <Suspense
        fallback={
          <div className="flex justify-center overflow-hidden">
            <SpinnerIcon />
          </div>
        }
      >
        <Await resolve={root.data?.cart}>
          {(cart) => (
            <CartProvider data={cart}>
              <CartContents
                cart={cart}
                product={product}
                cartPods={cartPods}
                ipData={ipData}
                fallbackPodId={root.data.layout.fallbackPodId}
              />
            </CartProvider>
          )}
        </Await>
      </Suspense>
    </section>
  );
}
