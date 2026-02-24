import {ActionFunctionArgs, json} from '@shopify/remix-oxygen';

export async function action({context, request}: ActionFunctionArgs) {
  try {
    // Parse the request body to get the list name
    const formData = await request.formData();
    const listName = String(formData.get('listName') || 'My Wishlist');

    const result = await context.swymApiClient.createList(listName);

    return json({success: true, data: result});
  } catch (error: any) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
