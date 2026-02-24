import {AnalyticsPageType, ShopifyAnalyticsProduct} from '@shopify/hydrogen';
import {ProductVariant} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';

import ProductForm from '~/components/product/Form';
import {CioResultData} from '~/lib/constructor/types';
import {ExtendedProduct} from '~/lib/shopify/types';
import AddToWishlistButton from '~/lib/swym/components/wishlist/AddToWishlistButton';
import {stripGlobalId} from '~/utils';

import {squareButtonStyles} from '../elements/Button';
import LocalizedA from '../global/LocalizedA';
import ProductPrices from './CioCard/ProductPrices';
import Tags from './Tags';
type Props = {
  // Promo Products Card
  selectedVariant?: ProductVariant;
  setCurrentProductHandle: (handle: string) => void;
  // PLP Collection Quick View Card
  data: CioResultData;
  product: ExtendedProduct;
  variants: ProductVariant[];
  // PDP YMAL Card
  setShouldFetch?: () => void;
  isPDPYMALCard?: boolean;
};

export default function ProductWidget({
  selectedVariant,
  setCurrentProductHandle,
  data,
  product,
  variants,
  setShouldFetch,
  isPDPYMALCard,
}: Props) {
  const productAnalytics: ShopifyAnalyticsProduct = {
    productGid: product.id,
    variantGid: selectedVariant ? selectedVariant.id : '',
    name: product.title,
    variantName: selectedVariant ? selectedVariant.title : '',
    brand: product.vendor,
    price: selectedVariant ? selectedVariant.price.amount : '',
  };

  if (!data && !product) {
    return null;
  }

  const isNewProduct =
    Date.now() -
      new Date(
        data.activation_date?.value
          ? data.activation_date.value
          : data.activation_date,
      ).getTime() <
    30 * 24 * 60 * 60 * 1000;

  const isBestSeller = product.bestSeller?.value === 'true';

  return (
    <div
      className={clsx(
        'pointer-events-auto z-10 ml-auto rounded bg-white px-0 text-left md:px-0 md:pb-6',
        'lg:px-6',
      )}
    >
      {/* Tags */}
      <div className="badge mb-4">
        <Tags isNewProduct={isNewProduct} isBestSeller={isBestSeller} />
      </div>

      {/* Title */}
      {selectedVariant && (
        <h1 className="hidden pb-4 text-xl font-light lg:block">
          {selectedVariant.product.title}
        </h1>
      )}

      {/* Reviews */}
      {product && (
        <div
          className="ratings-container ratings-container__modal mb-4 h-6"
          data-bv-show="inline_rating"
          data-bv-product-id={stripGlobalId(product.id)}
          data-bv-seo="false"
        ></div>
      )}

      <div className="relative flex justify-between">
        {/* Prices */}
        {product && selectedVariant && (
          <ProductPrices data={product} selectedVariant={selectedVariant} />
        )}
      </div>
      {/* Divider */}
      <div className="my-4 w-full border-b border-gray" />

      {/* Product options */}
      {selectedVariant && product && (
        <ProductForm
          product={product}
          variants={variants}
          data={data}
          selectedVariant={selectedVariant}
          analytics={{
            pageType: AnalyticsPageType.product,
            resourceId: product.id,
            products: [productAnalytics],
            totalValue: parseFloat(selectedVariant.price.amount),
          }}
          setCurrentProductHandle={setCurrentProductHandle}
          setShouldFetch={setShouldFetch}
          isPDPYMALCard={isPDPYMALCard}
        />
      )}

      {product.isQuickView && (
        <div>
          <div className="mt-4 block md:hidden">
            <LocalizedA href={`/products/${product.handle}`} rel="noreferrer">
              <span
                className={clsx([
                  squareButtonStyles({tone: 'light'}),
                  'mt-4 w-full text-primary underline',
                ])}
              >
                See Details
              </span>
            </LocalizedA>
          </div>
        </div>
      )}
    </div>
  );
}
