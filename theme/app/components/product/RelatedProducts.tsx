import clsx from 'clsx';

import ProductCard from '~/components/product/Card';
import {useColorTheme} from '~/lib/theme';
import type {ProductWithNodes} from '~/types/shopify';

type Props = {
  relatedProducts: ProductWithNodes[];
};

export default function RelatedProducts({relatedProducts}: Props) {
  const colorTheme = useColorTheme();
  const products = relatedProducts && relatedProducts?.slice(0, 4);

  return (
    <div
      className={clsx(
        'border-t border-gray pt-[30px] lg:border-none lg:py-20', //
        'md:px-4',
      )}
      style={{background: colorTheme?.background || 'white'}}
    >
      <h3
        className={clsx(
          'mb-[14px] text-lg2 leading-[1.6]', //
          'md:text-center md:text-xl2',
        )}
      >
        You May Also Like
      </h3>
      <div
        className={clsx(
          'grid grid-cols-2 gap-3 pb-6', //
          'md:grid-cols-4',
        )}
      >
        {products.map((product) => (
          <ProductCard key={product.id} storefrontProduct={product} />
        ))}
      </div>
    </div>
  );
}
