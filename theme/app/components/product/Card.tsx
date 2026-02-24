import {Image, type ShopifyAnalyticsProduct} from '@shopify/hydrogen';
import type {ProductVariant} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';

import Badge from '~/components/elements/Badge';
import {Link} from '~/components/Link';
import AddToCartButton from '~/components/product/buttons/AddToCartButton';
import {useGid} from '~/lib/utils';
import type {ProductWithNodes} from '~/types/shopify';

import Currency from '../global/Currency';

type Props = {
  imageAspectClassName?: string;
  storefrontProduct: ProductWithNodes;
  variantGid?: string;
};

export default function ProductCard({
  imageAspectClassName = 'aspect-[335/448]',
  storefrontProduct,
  variantGid,
}: Props) {
  const firstVariant =
    useGid<ProductVariant>(variantGid) ??
    storefrontProduct?.variants?.nodes.find(
      (variant) => variant.id == variantGid,
    ) ??
    storefrontProduct?.variants?.nodes[0];

  if (firstVariant == null) {
    return null;
  }

  const productAnalytics: ShopifyAnalyticsProduct = {
    productGid: storefrontProduct.id ? storefrontProduct.id : '',
    variantGid: firstVariant.id,
    name: storefrontProduct.title ? storefrontProduct.title : '',
    variantName: firstVariant.title,
    brand: storefrontProduct.vendor ? storefrontProduct.vendor : '',
    price: firstVariant.price.amount,
    quantity: 1,
  };

  return (
    <div className="group relative">
      <div
        className={clsx([
          imageAspectClassName,
          'group/image relative flex items-center justify-center overflow-hidden bg-lightGray object-cover',
        ])}
      >
        <Link
          className="absolute left-0 top-0 h-full w-full"
          to={`/products/${storefrontProduct.handle}`}
        >
          {firstVariant.image && (
            <Image
              className="absolute h-full w-full transform bg-cover bg-center object-cover object-center ease-in-out"
              data={firstVariant.image}
              crop="center"
              sizes="100%"
              height={
                firstVariant.image.height ? firstVariant.image.height : 'auto'
              }
              width={
                firstVariant.image.width ? firstVariant.image.width : 'auto'
              }
              aspectRatio="170/227"
            />
          )}
          {storefrontProduct?.back_image?.reference?.image?.url && (
            <div className="absolute left-0 top-0 hidden h-full w-full translate-y-full transition-all duration-500 ease-in-out group-hover/image:block group-hover/image:translate-y-0">
              <Image
                className="h-full w-full object-cover"
                src={storefrontProduct?.back_image?.reference?.image?.url}
                alt="back image"
                loading="lazy"
              />
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-4 top-4">
            {/* Sale */}
            {firstVariant?.availableForSale && firstVariant?.compareAtPrice && (
              <Badge label="Sale" tone="critical" />
            )}
            {/* Sold out */}
            {!firstVariant?.availableForSale && <Badge label="Sold out" />}
          </div>
        </Link>

        {/* Quick add to cart */}
        {firstVariant.availableForSale && (
          <div
            className={clsx(
              'absolute bottom-0 right-4 translate-y-full pb-4 duration-200 ease-in-out',
              'group-hover:block group-hover:translate-y-0',
            )}
          >
            <AddToCartButton
              lines={[
                {
                  merchandiseId: firstVariant.id,
                  quantity: 1,
                },
              ]}
              disabled={!firstVariant.availableForSale}
              analytics={{
                products: [productAnalytics],
                totalValue: parseFloat(productAnalytics.price),
              }}
            >
              Quick add
            </AddToCartButton>
          </div>
        )}
      </div>

      <div className="mt-[20px] text-center text-md">
        <div className="space-y-1">
          {/* Title */}
          <Link
            className={clsx(
              'text-[14px] font-bold', //
              'hover:underline',
            )}
            to={`/products/${storefrontProduct.handle}`}
          >
            {storefrontProduct.title}
          </Link>

          {/* Price / compare at price */}
          <div className="mt-3 flex justify-center text-[12px] font-bold">
            {firstVariant.compareAtPrice && (
              <span className="text-darkGray">
                <Currency
                  data={firstVariant.compareAtPrice}
                  className="mr-2.5 line-through decoration-red"
                />
              </span>
            )}
            {firstVariant.price && <Currency data={firstVariant.price} />}
          </div>
        </div>
      </div>
    </div>
  );
}
