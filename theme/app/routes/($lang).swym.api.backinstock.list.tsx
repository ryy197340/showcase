import {json, LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({context}: LoaderFunctionArgs) {
  try {
    const result = await context.swymApiClient.fetchBackInStockSubscriptions(
      'backinstock',
    );

    return json({success: true, data: result});
  } catch (error: any) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
