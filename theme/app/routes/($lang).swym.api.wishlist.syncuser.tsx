import {json, LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({context, request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');

  if (!email) {
    return json(
      {
        success: false,
        error: 'user not authenticated to sync list, no email',
      },
      {status: 400},
    );
  }

  try {
    const result = await context.swymApiClient.guestValidateSync(email);
    return json({success: true, data: result});
  } catch (error: any) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
