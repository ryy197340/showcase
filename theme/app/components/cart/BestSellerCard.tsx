import {Image} from '@shopify/hydrogen';
import {RecommendProduct} from '@xgenai/sdk-core/dist/types/recommend';
import clsx from 'clsx';

import {Link} from '~/components/Link';

import Currency from '../global/Currency';
import CurrencyRange from '../global/CurrencyRange';

type Props = {
  title: string;
  data: RecommendProduct;
  imageAspectClassName?: string;
  loading: 'eager' | 'lazy';
  priceData?: any;
  isRestingSearch?: boolean;
};

export default function BestSellerCard({
  title,
  data,
  imageAspectClassName = 'aspect-[335/448]',
  loading,
  priceData,
  isRestingSearch,
}: Props) {
  // for localized price
  const price = priceData?.priceRange?.minVariantPrice;
  const compareAtPrice = priceData?.compareAtPriceRange?.maxVariantPrice;
  const link = new URL(data.link).pathname;

  return (
    <div className="group relative w-full overflow-auto" role="presentation">
      <div
        className={clsx([
          imageAspectClassName,
          'group/image relative flex items-center justify-center overflow-hidden bg-lightGray object-cover',
        ])}
      >
        <Link
          className="absolute left-0 top-0 h-full w-full"
          to={link}
          prefetch={isRestingSearch ? 'none' : 'intent'}
        >
          {data.image && (
            <Image
              className="absolute h-full w-full transform bg-cover bg-center object-cover object-center ease-in-out"
              crop="center"
              sizes="100%"
              aspectRatio="170/227"
              src={data.image}
              width={350}
              height={500}
              loading={loading}
            />
          )}

          {data?.back_image && !isRestingSearch && (
            <div className="absolute left-0 top-0 hidden h-full w-full translate-y-full transition-all duration-500 ease-in-out group-hover/image:block group-hover/image:translate-y-0">
              <Image
                className="h-full w-full object-cover"
                src={data?.back_image}
                alt="back image"
                loading="lazy"
              />
            </div>
          )}
        </Link>
      </div>

      <div
        className={`${
          isRestingSearch ? 'mt-[5px]' : 'mt-[10px]'
        } pb-5 text-center text-md`}
      >
        {/* Pre-order */}
        {data?.preorder_message && !isRestingSearch && (
          <div className="mb-[6px] flex justify-center gap-[5px] text-[11px] font-bold uppercase text-preorderMessage">
            {data.preorder_message}
          </div>
        )}
        <div
          className={`flex flex-col  gap-y-[10px] space-y-1 ${
            !isRestingSearch ? 'items-start' : 'items-center'
          }`}
        >
          {/* Title */}
          <Link className="text-[14px]" to={data.url} prefetch="intent">
            {title}
          </Link>

          {/* Price */}
          <div className="mt-3 flex justify-center text-[11px]">
            {price ? (
              title === 'Digital Gift Card' ? (
                <CurrencyRange priceRange={priceData.priceRange} />
              ) : (
                <div className="flex flex-row gap-x-5">
                  {compareAtPrice?.amount &&
                    parseFloat(compareAtPrice.amount) > 0 && (
                      <span className="line-through opacity-50">
                        <Currency data={compareAtPrice} />
                      </span>
                    )}
                  <Currency
                    className={`${
                      compareAtPrice?.amount &&
                      parseFloat(compareAtPrice.amount) > 0
                        ? 'text-red'
                        : ''
                    }`}
                    data={price}
                  />
                </div>
              )
            ) : data.price ? (
              <div>
                <span>${data.price}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
