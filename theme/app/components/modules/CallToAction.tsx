import {useMatches} from '@remix-run/react';
import clsx from 'clsx';

import Link from '~/components/elements/Link';
import SanityImage from '~/components/media/SanityImage';
import ProductHero from '~/components/product/ProductHero';
import type {
  CallToActionImage,
  SanityAssetImage,
  SanityModuleCallToAction,
  SanityProductWithVariant,
} from '~/lib/sanity';

type Props = {
  module: SanityModuleCallToAction;
};

export default function CallToActionModule({module}: Props) {
  return (
    <div
      className={clsx(
        'page-width flex gap-5 px-10 md:gap-[5vw]', //
        module.layout === 'left' && 'flex-col md:flex-row',
        module.layout === 'right' && 'flex-col-reverse md:flex-row-reverse',
      )}
    >
      <div className="relative aspect-[864/485] grow">
        {module.content && <ModuleContent content={module.content} />}
      </div>

      <div
        className={clsx(
          'mr-auto flex w-full shrink-0 flex-col items-center justify-center', //
          'md:max-w-[20rem] md:items-start',
        )}
      >
        {/* Title */}
        <div className="h1 ml-auto mr-auto">{module.title}</div>

        {/* Body */}
        {module.body && (
          <div className="mt-4 text-center leading-paragraph">
            {module.body}
          </div>
        )}

        {/* Link */}
        {module.link && (
          <div className="mt-4">
            <Link
              className="font-bold underline hover:no-underline"
              link={module.link}
            >
              {module.link.title}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleContent({
  content,
}: {
  content: SanityAssetImage | SanityProductWithVariant | CallToActionImage;
}) {
  const [root] = useMatches();
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;

  switch (content?._type) {
    case 'image': {
      return (
        <SanityImage
          alt={content?.altText}
          crop={content?.crop}
          dataset={sanityDataset}
          hotspot={content?.hotspot}
          layout="fill"
          objectFit="cover"
          projectId={sanityProjectID}
          sizes="100vw"
          src={content?.asset?._ref}
        />
      );
    }
    case 'callToActionImage': {
      return (
        <>
          {content?.callToActionImage?.desktopImage && (
            <SanityImage
              alt={content.callToActionImage.desktopAltText}
              crop={content.callToActionImage.desktopImage.crop}
              dataset={sanityDataset}
              hotspot={content.callToActionImage.desktopImage.hotspot}
              layout="fill"
              objectFit="cover"
              projectId={sanityProjectID}
              sizes="100vw"
              src={content.callToActionImage.desktopImage.asset?._ref}
              height={content.callToActionImage.desktopImage.height}
              width={content.callToActionImage.desktopImage.width}
              loading="lazy"
              className="hidden md:block"
            />
          )}
          {content?.callToActionImage?.mobileImage && (
            <SanityImage
              alt={content.callToActionImage.mobileAltText}
              crop={content.callToActionImage.mobileImage.crop}
              dataset={sanityDataset}
              hotspot={content.callToActionImage.mobileImage.hotspot}
              layout="fill"
              objectFit="cover"
              projectId={sanityProjectID}
              sizes="100vw"
              src={content.callToActionImage.mobileImage.asset?._ref}
              height={content.callToActionImage.mobileImage.height}
              width={content.callToActionImage.mobileImage.width}
              loading="lazy"
              className="md:hidden"
            />
          )}
        </>
      );
    }
    case 'productWithVariant': {
      if (!content?.gid || !content.variantGid) {
        return null;
      }

      return <ProductHero gid={content?.gid} variantGid={content.variantGid} />;
    }
    default:
      return null;
  }
}
