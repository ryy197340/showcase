import {ActionFunctionArgs, json} from '@shopify/remix-oxygen';

export async function action({context, request}: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const productId = Number(formData.get('productId'));
    const variantId = Number(formData.get('variantId'));
    const productUrl = String(formData.get('productUrl'));
    const listId = String(formData.get('listId'));

    if (!productId || !variantId || !productUrl || !listId) {
      return json(
        {success: false, error: 'Missing required fields'},
        {status: 400},
      );
    }

    const result = await context.swymApiClient.removeFromWishlist(
      productId,
      variantId,
      productUrl,
      listId,
    );

    return json({success: true, data: result});
  } catch (error: any) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
