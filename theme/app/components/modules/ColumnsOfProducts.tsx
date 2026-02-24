import {stegaClean} from '@sanity/client/stega';
import {Image} from '@shopify/hydrogen';
import useEmblaCarousel from 'embla-carousel-react';
import {useEffect, useState} from 'react';

import {Link} from '~/components/Link';
import {
  ColumnsOfProducts as ColumnsOfProductsType,
  ProductColumn,
} from '~/lib/sanity'; // Adjust the import path accordingly
import {hexToRgba} from '~/utils/styleHelpers';

type Props = {
  module?: ColumnsOfProductsType;
};

export default function ColumnsOfProducts({module}: Props) {
  const [, setCurrentSlide] = useState<number>(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    slidesToScroll: 1,
  });

  useEffect(() => {
    if (!emblaApi) return;

    const handleScroll = () => {
      const thisSlide = emblaApi.selectedScrollSnap();
      setCurrentSlide(thisSlide);
    };

    emblaApi.on('scroll', handleScroll);
    return () => {
      if (!emblaApi) {
        return;
      }
      emblaApi.off('scroll', handleScroll);
    };
  }, [emblaApi]);

  if (!module) {
    return null;
  }

  const firstImageDimensions = {
    desktop: {
      height: module.columns[0]?.textContent?.productImage?.height,
      width: module.columns[0]?.textContent?.productImage?.width,
    },
    mobile: {
      height: module.columns[0]?.textContent?.productImageMobile?.height,
      width: module.columns[0]?.textContent?.productImageMobile?.width,
    },
  };

  return (
    <div className="page-width embla px-0 py-0" ref={emblaRef}>
      {/* Embla Carousel Wrapper */}
      <div className="cop-slider embla__container flex lg:h-[303px] lg:justify-center">
        {module.columns.map((column, index: number) => (
          <div
            key={column._key}
            className={`${
              column.textContent.mobileSlideWidth === 'full-width'
                ? 'slide-full'
                : 'slide-half'
            } flex w-full lg:h-[303px] lg:w-[203px]`}
          >
            <ColumnsProductCard
              column={column}
              firstImageDimensions={firstImageDimensions}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type ProductCardProps = {
  column: ProductColumn;
  firstImageDimensions: {
    desktop: {height: number; width: number};
    mobile: {height: number; width: number};
  };
};

function ColumnsProductCard({column, firstImageDimensions}: ProductCardProps) {
  const productImage = column.textContent?.productImage;
  const productImageMobile = column.textContent?.productImageMobile;
  const link = column.textContent?.link;
  const textOverlay = column.textContent?.textOverlay;

  if (!productImage && !productImageMobile && !link) {
    return null;
  }

  return (
    <div
      className={`bg-gray-100 items-${
        column.textContent?.textAlign
          ? stegaClean(column.textContent?.textAlign)
          : 'left'
      } flex w-full flex-col`}
    >
      <Link
        to={link?.slug ? link.slug : ''}
        className="mb-[3px] w-full px-[4px]"
      >
        <div
          className={`relative ${
            column.textContent?.hoverZoom ? 'hover-zoom' : ''
          } ${column.textContent?.borderRadius ? 'rounded-[1rem]' : ''}`}
        >
          {productImage?.url && (
            <Image
              src={productImage?.url}
              aspectRatio={`${firstImageDimensions.desktop.width}/${firstImageDimensions.desktop.height}`}
              alt={column.textContent.altText || ''}
              className="hidden w-full object-contain lg:block lg:max-h-[270px]"
            />
          )}
          {productImageMobile?.url && (
            <Image
              src={productImageMobile?.url}
              aspectRatio={`${firstImageDimensions.mobile.width}/${firstImageDimensions.mobile.height}`}
              alt={column.textContent.altText || ''}
              className={`mb-1 block w-full object-cover lg:hidden ${
                column.textContent?.borderRadius ? 'rounded-[1rem]' : ''
              }`}
            />
          )}

          {/* Overlay Title */}
          {textOverlay && link?.title && (
            <div
              className={`
              absolute inset-0 flex justify-center
              ${
                column.textContent?.textOverlayAlignment === 'top'
                  ? 'items-start pt-4'
                  : column.textContent?.textOverlayAlignment === 'bottom'
                  ? 'items-end pb-4'
                  : 'items-center'
              }
            `}
            >
              <span
                className={`px-2 py-1 text-xs font-medium text-white md:text-sm ${
                  !link.hideUnderline
                    ? 'underline decoration-2 underline-offset-4'
                    : ''
                }`}
                style={{
                  background: hexToRgba(link.buttonStyle?.background),
                  color: link.buttonStyle?.text,
                }}
              >
                {link.title}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Default Title (only show if NOT overlay) */}
      {!textOverlay && link?.title && (
        <Link
          to={link?.slug ? link.slug : ''}
          className="px-[4px] text-[10px] tracking-[1px] text-primary hover:underline md:text-[12px]"
          style={{
            background: hexToRgba(link.buttonStyle?.background),
            color: link.buttonStyle?.text,
          }}
        >
          {link.title}
        </Link>
      )}
    </div>
  );
}
