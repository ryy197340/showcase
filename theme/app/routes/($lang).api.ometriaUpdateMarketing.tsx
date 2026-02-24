// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-console */
import {json} from '@shopify/remix-oxygen';

import {isProduction} from '../utils/global';

export const loader = async () => {
  return json({error: 'Method Not Allowed'}, {status: 405});
};

/**
 * Handles a POST request to opt a user into marketing via Ometria's `/v2/push` endpoint.
 *
 * Accepts a JSON body with an `email` (required) and optional `id`.
 * Sends a profile object to Ometria that updates the `marketing_optin` value.
 */
export const action = async ({
  request,
  context,
}: {
  request: Request;
  context: {
    env: {
      OMETRIA_STAGING_API_KEY: string;
      OMETRIA_PRODUCTION_API_KEY: string;
    };
  };
}) => {
  const isDevEnv = !isProduction(request.url);
  const OMETRIA_API_KEY = isDevEnv
    ? context.env.OMETRIA_STAGING_API_KEY
    : context.env.OMETRIA_PRODUCTION_API_KEY;

  const body = await request.json();
  const {email, id} = body as {email: string; id?: string};

  if (!email || typeof email !== 'string') {
    return json({formError: 'Missing or invalid email'}, {status: 400});
  }

  const payload: Record<string, any> = {
    '@type': 'contact',
    '@merge': true,
    email,
    marketing_optin: 'EXPLICITLY_OPTEDIN',
  };

  if (id && typeof id === 'string') {
    payload.id = id;
  }

  try {
    const response = await fetch('https://api.ometria.com/v2/push', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Ometria-Auth': OMETRIA_API_KEY,
      },
      body: JSON.stringify([payload]), // must be an array
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Ometria push error (${response.status}):`, data);
      return json(
        {formError: 'Failed to push profile to Ometria.'},
        {status: response.status},
      );
    }

    console.log(
      `Ometria profile pushed for ${email}:\n`,
      JSON.stringify(data, null, 2),
    );
    return json({success: true});
  } catch (error) {
    console.error('Ometria push error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return json(
      {formError: 'Something went wrong. Please try again later.'},
      {status: 500},
    );
  }
};
