import {useMatches} from '@remix-run/react';
import {stegaClean} from '@sanity/client/stega';
import clsx from 'clsx';
import {memo} from 'react';

import Button from '~/components/elements/Button';
import Link from '~/components/elements/Link';
import SanityImage from '~/components/media/SanityImage';
import ProductHotspot from '~/components/product/Hotspot';
import ProductTag from '~/components/product/Tag';
import type {SanityModuleImage} from '~/lib/sanity';

type Props = {
  module: SanityModuleImage;
  isBlogModule?: boolean;
  isHeroImage?: boolean;
};

function ImageModule({module, isBlogModule, isHeroImage}: Props) {
  if (!module.image) {
    return null;
  }

  return (
    <div
      className={`page-width relative ${isHeroImage ? '' : 'px-5 md:px-10'} ${
        module.cssClass ? `${module.cssClass}` : ''
      }`}
    >
      {module.variant === 'callToAction' && module.callToAction?.link ? (
        <Link className="group" link={module.callToAction.link}>
          <ImageContent module={module} isHeroImage={isHeroImage} />
        </Link>
      ) : (
        <ImageContent module={module} />
      )}

      {/* Caption */}
      {module.variant === 'caption' && module.caption && (
        <div className="mx-auto mt-5 max-w-[45rem] text-center text-xs leading-caption text-primary lg:pl-10">
          {module.caption.split('\n').map(function (line, index) {
            return (
              <p key={line}>
                {line}
                {module.caption
                  ? index < module.caption.split('\n').length - 1 && <br />
                  : null}
              </p>
            );
          })}
        </div>
      )}
      {/* Product hotspots */}
      {module.variant === 'productHotspots' && (
        <>
          {module.productHotspots?.map((hotspot) => {
            if (!hotspot?.product?.gid) {
              return null;
            }
            return (
              <ProductHotspot
                key={hotspot._key}
                productGid={hotspot?.product?.gid}
                variantGid={hotspot?.product?.variantGid}
                x={hotspot.x}
                y={hotspot.y}
                relatedProducts={hotspot?.product.relatedProducts}
              />
            );
          })}
        </>
      )}
      {/* Product tags */}
      {module.variant === 'productTags' && (
        <div className="mt-2 flex flex-wrap gap-x-1 gap-y-2">
          {module.productTags?.map((tag) => {
            if (!tag?.gid) {
              return null;
            }

            return (
              <ProductTag
                key={tag._key}
                productGid={tag?.gid}
                variantGid={tag?.variantGid}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

const ImageContent = memo(({module, isHeroImage}: Props) => {
  const image = module.image;
  const [root] = useMatches();
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;
  return (
    <div
      className={
        isHeroImage
          ? ''
          : `${clsx(
              'image-content relative overflow-hidden rounded transition-[border-radius] duration-500 ease-out',
            )}`
      }
    >
      <SanityImage
        title={module.imageTitle}
        alttext={stegaClean(module.altText)}
        crop={image?.crop}
        dataset={sanityDataset}
        hotspot={image?.hotspot}
        layout="responsive"
        projectId={sanityProjectID}
        sizes={['50vw, 100vw']}
        src={image?.asset?._ref}
        width={image?.width}
        height={image?.height}
        className={module.imageMobile ? 'hidden md:block' : 'block'}
      />
      {module.imageMobile && (
        <SanityImage
          title={module.imageTitle}
          alttext={stegaClean(module.altText)}
          alt={module.altText}
          crop={module.imageMobile?.crop}
          dataset={sanityDataset}
          hotspot={module.imageMobile?.hotspot}
          layout="responsive"
          projectId={sanityProjectID}
          sizes={['50vw, 100vw']}
          src={module.imageMobile?.asset?._ref}
          width={module.imageMobile?.width}
          height={module.imageMobile?.height}
          className="md:hidden"
        />
      )}
      {/* Call to action */}
      {module.variant === 'callToAction' && (
        <div
          className={
            isHeroImage
              ? ''
              : `absolute left-0 top-0 flex h-full w-full items-center justify-center ${
                  module.callToAction?.title &&
                  !module.callToAction?.removeOverlayTint
                    ? 'bg-black bg-opacity-20 duration-500 ease-out group-hover:bg-opacity-30'
                    : ''
                }`
          }
        >
          {!isHeroImage && module.callToAction?.title && (
            <div className="mt-[1em] flex flex-col items-center gap-5">
              {/* Title */}
              <div
                className={clsx(
                  'max-w-[30rem] text-xl text-white', //
                  'lg:text-2xl',
                  'xl:text-3xl',
                )}
              >
                {module.callToAction?.title}
              </div>

              {/* Button */}
              {module.callToAction?.link && (
                <Button className={clsx('bg-primary text-white')}>
                  {module.callToAction.link.title}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default memo(ImageModule);
