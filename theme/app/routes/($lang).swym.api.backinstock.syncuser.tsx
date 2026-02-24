import {json, LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {BIS_REG_ID} from '~/lib/swym/swymConstants';

export async function loader({context, request}: LoaderFunctionArgs) {
  const {session} = context;
  session.unset(BIS_REG_ID);
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
    const result = await context.swymApiClient.guestValidateSyncBIS(email);
    return json({success: true, data: result});
  } catch (error: any) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
