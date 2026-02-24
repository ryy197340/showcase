import {
  AttributeInput,
  CountryCode,
} from '@shopify/hydrogen/storefront-api-types';
import {ActionFunctionArgs} from '@shopify/remix-oxygen';

interface RequestBody {
  countryCode: CountryCode;
}

export async function action({context, request}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {status: 405});
  }

  const requestBody = (await request.json()) as RequestBody;
  const {countryCode} = requestBody;
  const {cart} = context;
  const freshCart = await cart.get();

  if (!freshCart) {
    return new Response('No cart found', {status: 404});
  }

  const cartAttributes: AttributeInput[] =
    freshCart?.attributes?.map((attr) => ({
      key: attr.key,
      value: attr.value ?? '',
    })) || [];

  try {
    const updatedAttributes = [
      ...cartAttributes,
      {key: 'checkoutLocale', value: countryCode},
    ];
    const result = await cart.updateAttributes(updatedAttributes, {
      country: countryCode,
    });
    return new Response(JSON.stringify(result), {status: 200});
  } catch (error: any) {
    return new Response('Error updating buyer identity', {status: 500});
  }
}
