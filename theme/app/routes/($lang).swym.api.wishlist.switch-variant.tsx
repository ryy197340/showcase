import {ActionFunctionArgs, json} from '@shopify/remix-oxygen';

export async function action({context, request}: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const productId = Number(formData.get('productId'));
    const oldVariantId = Number(formData.get('oldVariantId'));
    const newVariantId = Number(formData.get('newVariantId'));
    const productUrl = String(formData.get('productUrl'));
    const listId = String(formData.get('listId'));

    if (
      !productId ||
      !oldVariantId ||
      !newVariantId ||
      !productUrl ||
      !listId
    ) {
      return json(
        {success: false, error: 'Missing required fields'},
        {status: 400},
      );
    }

    const result = await context.swymApiClient.switchVariant(
      productId,
      oldVariantId,
      newVariantId,
      productUrl,
      listId,
    );

    return json({success: true, data: result});
  } catch (error: any) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
