import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';
import {useEffect, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

import Button, {squareButtonStyles} from '~/components/elements/Button';
import {Link} from '~/components/Link';
import {GuideProduct as GuideProductType} from '~/lib/sanity';

type Props = {
  module?: GuideProductType;
};

export default function GuideProduct({module}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 500);
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 500);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  if (!module) {
    return null;
  }
  const {images, productInfo} = module;
  const [image1, image2] = images ? images : [null, null];
  const {productTitle, productDescription, bulletPoints, internalLink} =
    productInfo;

  return (
    <div className="page-width px-5 md:px-10 lg:px-[156px]">
      <div className="flex flex-col md:flex-row">
        {(image1 || image2) && (
          <div
            className={`pant-guide flex w-full flex-row gap-[10px] md:order-1 md:w-1/3 md:flex-row md:gap-0`}
          >
            {/* Image 1 */}
            {image1 &&
              (image1.guideProductImage.imageMobile && isMobile ? (
                <Image
                  src={image1.guideProductImage.imageMobile.url}
                  alt={image1.guideProductImage.imageAltText}
                  className={`w-1/2 aspect-w-[${image1?.guideProductImage.imageMobile.width}px] object-cover aspect-h-[${image1?.guideProductImage.imageMobile.height}px] md:w-full`}
                  sizes="100%"
                  width={349}
                  height={464}
                />
              ) : (
                <Image
                  src={image1.guideProductImage.image.url}
                  alt={image1.guideProductImage.imageAltText}
                  className={`w-1/2 aspect-w-[${image1?.guideProductImage.image.width}px] object-cover aspect-h-[${image1?.guideProductImage.image.height}px] md:w-full`}
                  sizes="100%"
                  width={349}
                  height={464}
                />
              ))}
            {image2 &&
              (image2.guideProductImage.imageMobile && isMobile ? (
                <Image
                  src={image2.guideProductImage.imageMobile.url}
                  alt={image2?.guideProductImage.imageAltText}
                  className={`w-1/2 md:hidden aspect-w-[${image2.guideProductImage.imageMobile.width}px] object-cover aspect-h-[${image2?.guideProductImage.imageMobile.height}px]`}
                  sizes="100%"
                  width={349}
                  height={464}
                />
              ) : (
                <Image
                  src={image2.guideProductImage.image.url}
                  alt={image2.guideProductImage.imageAltText}
                  className={`w-1/2 md:hidden aspect-w-[${image2?.guideProductImage.image.width}px] object-cover aspect-h-[${image2?.guideProductImage.image.height}px]`}
                  sizes="100%"
                  width={349}
                  height={464}
                />
              ))}
          </div>
        )}
        <div
          className={`flex flex-col justify-center gap-5 p-5 md:order-2 md:w-1/3 md:p-4 lg:px-8`}
        >
          {/* Product Info */}
          {productTitle && (
            <h2 className="text-center text-xl2">{productTitle}</h2>
          )}
          {productDescription && (
            <p className="text-center text-sm leading-[20px]">
              {productDescription}
            </p>
          )}
          {bulletPoints && bulletPoints.length > 0 && (
            <ul className="m-auto w-fit pl-5 text-left text-sm leading-[20px] lg:m-0">
              {bulletPoints.map((point: string) => (
                <li className="list-disc" key={uuidv4()}>
                  {point}
                </li>
              ))}
            </ul>
          )}
          {/* Internal Link */}
          {internalLink && (
            <Link
              className="max-w-full text-center"
              to={`${internalLink?.slug}`}
              key={module._key}
            >
              <Button
                className={clsx([
                  squareButtonStyles({mode: 'default', tone: 'default'}),
                  'm-auto w-[240px] max-w-full text-center tracking-[1.2px]',
                ])}
                type="button"
              >
                {internalLink?.title}
              </Button>
            </Link>
          )}
        </div>
        {image2 && (
          <div className={`md:order-3 md:flex md:w-1/3 md:justify-end`}>
            {/* Image 2 */}
            <Image
              src={image2.guideProductImage.image.url}
              alt={image2.guideProductImage.image.altText}
              className={`hidden w-full object-cover md:block md:w-auto aspect-w-[${image2.guideProductImage.image.width}px] aspect-h-[${image2.guideProductImage.image.height}px]`}
              sizes="100%"
              width={349}
              height={464}
            />
          </div>
        )}
      </div>
    </div>
  );
}
