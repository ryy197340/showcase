import {ActionFunctionArgs} from '@shopify/remix-oxygen';

const CUSTOMER_ACCEPTS_MARKETING_MUTATION = `#graphql
  mutation customerUpdate($customer: CustomerUpdateInput!, $customerAccessToken: String!) {
    customerUpdate(customer: $customer, customerAccessToken: $customerAccessToken) {
      customer {
        acceptsMarketing
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`;

type RequestBody = {
  acceptsMarketing: boolean;
};

export async function action({context, request}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {status: 405});
  }
  const {acceptsMarketing}: RequestBody = await request.json();
  const customerAccessToken = await context.session.get('customerAccessToken');
  const MUTATION_VARIABLES = {
    customer: {
      acceptsMarketing,
    },
    customerAccessToken,
  };

  const {storefront} = context;
  const data = await storefront.mutate(CUSTOMER_ACCEPTS_MARKETING_MUTATION, {
    variables: MUTATION_VARIABLES,
  });
  const response = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}
