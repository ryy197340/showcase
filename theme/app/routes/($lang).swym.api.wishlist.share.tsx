import {ActionFunctionArgs, json} from '@shopify/remix-oxygen';

export async function action({context, request}: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const publicLid = String(formData.get('publicLid'));
    const senderName = String(formData.get('senderName'));
    const emailValue = String(formData.get('emailValue'));
    const note = String(formData.get('message'));

    if (!publicLid || !senderName || !emailValue) {
      return json(
        {success: false, error: 'Missing required fields'},
        {status: 400},
      );
    }

    const result = await context.swymApiClient.shareWishlistViaEmail(
      publicLid,
      senderName,
      emailValue,
      note,
    );

    return json({success: true, data: result});
  } catch (error: any) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
