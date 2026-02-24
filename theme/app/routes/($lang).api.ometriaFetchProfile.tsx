import {json} from '@shopify/remix-oxygen';

import {isProduction} from '../utils/global';

const rateLimitMap = new Map<string, number[]>();

export const loader = async () => {
  return json({error: 'Method Not Allowed'}, {status: 405});
};

/**
 * Handles a POST request to fetch an Ometria profile by email and generate a profile iframe URL.
 *
 * This action validates the submitted email address, determines the correct Ometria API credentials
 * based on the environment (production or staging), then fetches the user profile from Ometria.
 * If the profile is found, it returns a JSON response containing an iframe URL and profile data.
 *
 * @param {Object} params - The parameters object.
 * @param {Request} params.request - The incoming HTTP request, expected to contain form data with an `email` field.
 * @param {Object} params.context - The Remix context, including environment variables for Ometria.
 * @param {Object} params.context.env - Environment-specific Ometria credentials.
 * @param {string} params.context.env.OMETRIA_STAGING_API_KEY - API key for the Ometria staging environment.
 * @param {string} params.context.env.OMETRIA_STAGING_ACCOUNT - Account ID for the Ometria staging environment.
 * @param {string} params.context.env.OMETRIA_PRODUCTION_API_KEY - API key for the Ometria production environment.
 * @param {string} params.context.env.OMETRIA_PRODUCTION_ACCOUNT - Account ID for the Ometria production environment.
 *
 * @returns {Promise<Response>} A JSON response with either an iframe URL and profile data,
 *                              or a validation/form error with appropriate status code.
 */
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

  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 5;
  if (!rateLimitMap.has(email)) {
    rateLimitMap.set(email, []);
  }
  const timestamps = rateLimitMap.get(email)!;
  timestamps.push(now);
  while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
    timestamps.shift();
  }
  if (timestamps.length > maxRequests) {
    return json(
      {formError: 'Too many requests. Please try again later.'},
      {status: 429},
    );
  }

  try {
    const response = await fetch(
      `https://api.ometria.com/v2/profiles?email=${email}`,
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
      throw new Error('Failed to fetch Ometria profile ID');
    }

    type OmetriaResponse = {id: string}[];
    const data: OmetriaResponse = await response.json();
    const profile = data?.[0];

    if (!profile?.id) {
      return json(
        {
          formError:
            'If an account exists for this email, you’ll be able to update your preferences.',
        },
        {status: 404},
      );
    }

    const accountId = OMETRIA_ACCOUNT;
    const iframeUrl = `https://ometria.email/${accountId}/profile/${profile.id}/profile/`;

    return json({iframeUrl, profile});
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
