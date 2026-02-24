import {json} from '@shopify/remix-oxygen';

import {updateLocaleConfirmations} from '~/components/global/localizationSelector/utils';

interface RequestBody {
  locale: string;
}

export const action = async ({request}: {request: Request}) => {
  const requestBody = (await request.json()) as RequestBody;
  const locale = requestBody.locale;
  if (typeof locale === 'string') {
    const cookieHeader = request.headers.get('Cookie');
    const updatedCookieHeader = await updateLocaleConfirmations(
      locale,
      cookieHeader || undefined,
    );

    return new Response('Locale Updated', {
      headers: {
        'Set-Cookie': updatedCookieHeader,
      },
    });
  }

  return json({error: 'Locale not provided'}, {status: 400});
};
