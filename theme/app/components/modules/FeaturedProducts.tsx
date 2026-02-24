import {Image} from '@shopify/hydrogen';

import {FeaturedProducts as FeaturedProductsType} from '~/lib/sanity';

import {Link} from '../Link';
type Props = {
  module: FeaturedProductsType;
};

const CARD_STYLES =
  'absolute bottom-0 left-1/2 flex w-full -translate-x-1/2 flex-col px-3 py-[30px] text-white';

export default function FeaturedProducts({module}: Props) {
  const {heading, subheading, productColumns} = module;
  return (
    <div className="page-width flex flex-col items-center justify-center gap-[30px] text-center">
      <div className="flex flex-col gap-4">
        {heading && <h2>{heading}</h2>}
        {subheading && <span>{subheading}</span>}
      </div>
      <div
        className={`grid w-full grid-cols-2 gap-[6px] lg:grid-cols-${productColumns.length}`}
      >
        {productColumns?.map((column) => (
          <div className="flex w-full justify-center" key={column._key}>
            {column._type === 'singleProductColumn' && (
              <Link
                to={column.link.slug || ''}
                className="hover-zoom relative"
                prefetch="intent"
              >
                {/* Desktop image */}
                <Image
                  data={column.image}
                  width={336}
                  height={638}
                  aspectRatio="336/638"
                  className={`h-full object-cover ${
                    column.imageMobile ? 'hidden lg:block' : 'block'
                  }`}
                  alt={column.altText || ''}
                />
                {/* Mobile image */}
                {column.imageMobile && (
                  <Image
                    data={column.imageMobile}
                    width={336}
                    height={638}
                    aspectRatio="336/638"
                    className="block h-full object-cover lg:hidden"
                    alt={column.altText || ''}
                  />
                )}
                <div className={`gap-10 ${CARD_STYLES}`}>
                  {column.heading && (
                    <span className="h3 font-hoefler">{column.heading}</span>
                  )}
                  {column.link.title && (
                    <span className="button-link-border-b after:bg-white lg:block">
                      {column.link.title}
                    </span>
                  )}
                </div>
              </Link>
            )}
            {column._type === 'twoProductColumn' && (
              <div className="flex flex-col gap-[6px]">
                {column.twoProductColumns.map((col) => (
                  <div key={col._key} className="flex">
                    <Link
                      to={col.link.slug || ''}
                      className="hover-zoom relative"
                      prefetch="intent"
                    >
                      <Image
                        alt={col.altText || ''}
                        data={col.image}
                        width={336}
                        height={316}
                        aspectRatio="336/316"
                        className="hidden h-full object-cover lg:block"
                      />
                      <Image
                        alt={col.altText || ''}
                        data={col.imageMobile}
                        width={336}
                        height={316}
                        aspectRatio="336/316"
                        className="block h-full object-cover lg:hidden"
                      />
                      <div className={`gap-4 ${CARD_STYLES}`}>
                        {col.heading && (
                          <span className="h3 font-hoefler">{col.heading}</span>
                        )}
                        {col.link.title && (
                          <span className="button-link-border-b after:bg-white lg:block">
                            {col.link.title}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
