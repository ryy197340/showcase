import {json, LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {fetchWeSupplyData} from './($lang).account';

export async function loader({context, request}: LoaderFunctionArgs) {
  // Get the email and ordersIds from the query params
  const url = new URL(request.url);
  try {
    const email = url.searchParams.get('email') ?? undefined;
    const ordersIds = url.searchParams.get('ordersIds');
    if (!ordersIds) {
      return json({});
    }
    const ordersIdsArray = ordersIds ? ordersIds.split(',') : [];

    const weSupplyData = await fetchWeSupplyData(
      context,
      ordersIdsArray,
      email,
    );

    return json(weSupplyData);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in loader function:', error);
  }
}
