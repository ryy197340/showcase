import {ActionFunctionArgs, json} from '@shopify/remix-oxygen';

export async function action({context, request}: ActionFunctionArgs) {
  try {
    // Parse the request body to get the list name
    const formData = await request.formData();
    const listId = String(formData.get('listId'));
    const result = await context.swymApiClient.deleteList(listId);

    return json({success: true, data: result});
  } catch (error: any) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
