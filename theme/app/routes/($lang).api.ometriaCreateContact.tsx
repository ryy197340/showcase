import {json} from '@shopify/remix-oxygen';

import {isProduction} from '../utils/global';

export const loader = async () => {
  return json({error: 'Method Not Allowed'}, {status: 405});
};

/**
 * Handles a POST request to submit a contact to Ometria's API.
 *
 * Extracts `email`, `firstName`, and `lastName` from form data. Validates the email format,
 * generates a deterministic customer ID, and sends the data to the Ometria `/v2/push` endpoint
 * using the appropriate API key depending on the environment (staging or production).
 *
 * Responds with a success status or an error message, depending on the result of the API call.
 *
 * @param {Object} params - Parameters passed by the Remix framework.
 * @param {Request} params.request - The HTTP request, expected to contain form data.
 * @param {Object} params.context - Remix context, including environment variables.
 * @param {Object} params.context.env - Environment-specific API keys.
 * @param {string} params.context.env.OMETRIA_STAGING_API_KEY - Ometria staging API key.
 * @param {string} params.context.env.OMETRIA_PRODUCTION_API_KEY - Ometria production API key.
 *
 * @returns {Promise<Response>} A JSON response indicating success or containing a form error with a status code.
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

  const formData = await request.formData();
  const email = formData.get('email');
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    return json(
      {formError: 'Please provide a valid email address.'},
      {status: 400},
    );
  }

  const contactPayload = [
    {
      '@type': 'contact',
      id: generateOmetriaId(email),
      customer_id: generateOmetriaId(email), // generate unique ID from email
      email,
      firstname: firstName,
      lastname: lastName,
      marketing_optin: 'EXPLICITLY_OPTEDIN',
      '@force_optin': true,
    },
  ];

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
      // eslint-disable-next-line no-console
      console.error(`Ometria error (${response.status}):`, errorText);
      throw new Error('Failed to fetch Ometria profile ID');
    }

    type OmetriaResponse = {id: string}[];
    const data: OmetriaResponse = await response.json();
    const profile = data?.[0];

    if (!profile?.id) {
      // no account exists, create an account
      try {
        const response = await fetch('https://api.ometria.com/v2/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
            'X-Ometria-Auth': OMETRIA_API_KEY,
          },
          body: JSON.stringify(contactPayload),
        });
        const data = await response.json();

        if (!response.ok) {
          const errorText = await response.text();
          // eslint-disable-next-line no-console
          console.error(`Ometria push error (${response.status}):`, errorText);
          return json(
            {formError: 'Failed to push contact to Ometria.'},
            {status: response.status},
          );
        }

        // eslint-disable-next-line no-console
        console.log(`!!! Successfully pushed contact to Ometria:`, data);

        return json({success: true});
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Ometria API error:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        return json(
          {formError: 'Something went wrong. Please try again later.'},
          {status: 500},
        );
      }
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email has already been subscribed.',
        }),
        {status: 400, headers: {'Content-Type': 'application/json'}},
      );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
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

// Generate a unique, deterministic ID based on the email
function generateOmetriaId(email: string): string {
  return email
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '-')
    .slice(0, 255);
}
