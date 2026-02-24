import {
  type ActionFunction,
  type ActionFunctionArgs,
  type AppLoadContext,
  type LoaderFunctionArgs,
  redirect,
} from '@shopify/remix-oxygen';

import {
  BIS_REG_ID,
  BIS_SESSION_ID,
  REG_ID,
  SESSION_ID,
} from '~/lib/swym/swymConstants';

export async function doLogout(context: AppLoadContext) {
  const {session, cart} = context;

  session.unset('customerAccessToken');
  session.unset('customerEmail');
  session.unset(SESSION_ID);
  session.unset(REG_ID);
  session.unset(BIS_REG_ID);
  session.unset(BIS_SESSION_ID);

  const localeCountry = context?.storefront?.i18n?.country;

  // Remove customerAccessToken from existing cart
  const result = await cart.updateBuyerIdentity({
    customerAccessToken: null,
    countryCode: localeCountry,
  });

  // Update cart id in cookie
  const headers = cart.setCartId(result.cart.id);

  headers.append('Set-Cookie', await session.commit());

  return redirect(`${context.storefront.i18n.pathPrefix}/account/login`, {
    headers,
  });
}

export async function loader({context}: LoaderFunctionArgs) {
  return redirect(context.storefront.i18n.pathPrefix);
}

export const action: ActionFunction = async ({context}: ActionFunctionArgs) => {
  return doLogout(context);
};
