import {json, LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({context, request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const listId = url.searchParams.get('listId');

  if (!listId) {
    return json({success: false, error: 'Missing list ID'}, {status: 400});
  }

  try {
    const result = await context.swymApiClient.fetchPublicList(listId);
    return json({success: true, data: result});
  } catch (error: any) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
