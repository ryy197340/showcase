import {LoaderFunctionArgs, redirect} from '@shopify/remix-oxygen';

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const lid = url.searchParams.get('lid') || url.searchParams.get('hkey');

  return redirect(`/swym/sharedwishlist/${lid}`);
}
