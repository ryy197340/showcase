// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-console */
import {json} from '@shopify/remix-oxygen';

import {isProduction} from '../utils/global';

export const loader = async () => {
  return json({error: 'Method Not Allowed'}, {status: 405});
};

export const action = async ({
  request,
  context,
}: {
  request: Request;
  context: {
    env: {
      OMETRIA_STAGING_API_KEY: string;
      OMETRIA_STAGING_ACCOUNT: string;
      OMETRIA_PRODUCTION_ACCOUNT: string;
      OMETRIA_PRODUCTION_API_KEY: string;
    };
  };
}) => {
  const isDevEnv = !isProduction(request.url);
  const OMETRIA_ACCOUNT = isDevEnv
    ? context.env.OMETRIA_STAGING_ACCOUNT
    : context.env.OMETRIA_PRODUCTION_ACCOUNT;
  const OMETRIA_API_KEY = isDevEnv
    ? context.env.OMETRIA_STAGING_API_KEY
    : context.env.OMETRIA_PRODUCTION_API_KEY;
  const formData = await request.formData();
  const email = formData.get('email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    return json(
      {formError: 'Please provide a valid email address.'},
      {status: 400},
    );
  }

  try {
    const response = await fetch(
      `https://api.ometria.com/v2/contacts?email=${email}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Ometria-Auth': `${OMETRIA_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(`Ometria error (${response.status}):`, errorText);
      throw new Error('Failed to fetch Ometria contact');
    }

    type OmetriaResponse = {id: string}[];
    const data: OmetriaResponse = await response.json();
    const contact = data?.[0];

    if (!contact?.id) {
      console.log('!!! contact not found', email);
      return json({formError: 'Contact not found.'}, {status: 404});
    }

    return json({contact});
  } catch (error) {
    console.error('Ometria API error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return json(
      {formError: 'Something went wrong. Please try again later.'},
      {status: 500},
    );
  }
};
