import {CartForm} from '@shopify/hydrogen';
import {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import {useContext} from 'react';

import {GlobalContext} from '~/lib/utils';

export default function UpdateCartButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const {locale} = useContext(GlobalContext);
  return (
    <CartForm
      route={`${locale.pathPrefix}/cart`}
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}
