import {ActionFunctionArgs, json} from '@shopify/remix-oxygen';

export async function action({context, request}: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const email = String(formData.get('email'));
    const productId = String(formData.get('productId'));
    const variantId = String(formData.get('variantId'));
    const productUrl = String(formData.get('productUrl'));

    if (!email || !productId || !variantId || !productUrl) {
      return json(
        {success: false, error: 'Missing required fields'},
        {status: 400},
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json(
        {success: false, error: 'Invalid email format'},
        {status: 400},
      );
    }

    const product = {
      epi: Number(variantId),
      empi: Number(productId),
      du: productUrl,
    };

    const result = await context.swymApiClient.createBackInStockSubscription(
      product,
      'email',
      email,
      ['backinstock'],
      true, // Add to mailing list
    );

    return json({success: true, data: result});
  } catch (error: any) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
