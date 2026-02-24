import {type ActionFunctionArgs} from '@shopify/remix-oxygen';

export async function action({request, context}: ActionFunctionArgs) {
  const {cart} = context;
  const formData = await request.formData();

  const variantIdRaw = formData.get('variantId');
  const quantity = parseInt(formData.get('quantity') || '1', 10);

  if (!variantIdRaw || typeof variantIdRaw !== 'string') {
    return Response.json({error: 'Invalid variant ID'}, {status: 400});
  }

  const toGlobalId = (rawId: string) =>
    btoa(`gid://shopify/ProductVariant/${rawId}`);

  if (!variantIdRaw) {
    return Response.json(
      {error: 'Missing a variant ID from videowise'},
      {status: 400},
    );
  }

  const lines = [
    {
      merchandiseId: toGlobalId(variantIdRaw),
      quantity,
    },
  ];

  const result = await cart.addLines(lines);

  if (!result.cart) {
    return Response.json(
      {error: 'Could not add videowise product to cart'},
      {status: 500},
    );
  }

  const headers = cart.setCartId(result.cart.id);

  return Response.json({ok: true, cart: result.cart}, {headers});
}
