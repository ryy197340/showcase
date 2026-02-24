import {ActionFunctionArgs} from '@shopify/remix-oxygen';

const CUSTOMER_CREATE_MUTATION = `
  mutation customerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      userErrors {
        field
        message
      }
      customer {
        id
        email
        firstName
        lastName
        emailMarketingConsent {
          marketingState
        }
      }
    }
  }
`;

type RequestBody = {
  email: string;
  firstName: string;
  lastName: string;
};

export async function action({context, request}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {status: 405});
  }

  try {
    const body = (await request.json()) as unknown;

    if (
      !body ||
      typeof body !== 'object' ||
      !('email' in body) ||
      !('firstName' in body) ||
      !('lastName' in body) ||
      typeof (body as any).email !== 'string' ||
      typeof (body as any).firstName !== 'string' ||
      typeof (body as any).lastName !== 'string'
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Invalid input. Ensure email, firstName, and lastName are provided.',
        }),
        {status: 400, headers: {'Content-Type': 'application/json'}},
      );
    }

    const {email, firstName, lastName} = body as RequestBody;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({error: 'Invalid email format.'}), {
        status: 400,
        headers: {'Content-Type': 'application/json'},
      });
    }

    const {adminApiClient} = context;
    if (!adminApiClient) {
      return new Response(
        JSON.stringify({error: 'Admin API client is not configured.'}),
        {status: 500, headers: {'Content-Type': 'application/json'}},
      );
    }

    const {data} = await adminApiClient.request(CUSTOMER_CREATE_MUTATION, {
      variables: {
        input: {
          email,
          firstName,
          lastName,
          emailMarketingConsent: {
            marketingState: 'SUBSCRIBED',
            marketingOptInLevel: 'SINGLE_OPT_IN',
          },
        },
      },
    });

    if (data?.customerCreate?.userErrors?.length) {
      const emailError = data.customerCreate.userErrors.find(
        (error: {field: string | string[]}) => error.field?.includes('email'),
      );
      if (emailError) {
        // Handle shopify error messaging around email
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email has already been subscribed.',
          }),
          {status: 400, headers: {'Content-Type': 'application/json'}},
        );
      } else {
        return new Response(
          JSON.stringify({errors: data.customerCreate.userErrors}),
          {status: 400, headers: {'Content-Type': 'application/json'}},
        );
      }
    }

    return new Response(JSON.stringify(data.customerCreate.customer), {
      headers: {'Content-Type': 'application/json'},
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({error: 'An unexpected error occurred.'}),
      {status: 500, headers: {'Content-Type': 'application/json'}},
    );
  }
}
