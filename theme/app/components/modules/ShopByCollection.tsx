import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';

import {Link} from '~/components/Link';
import {useHydration} from '~/hooks/useHydration';
import {ModuleShopByCollection, ShopByCollectionCollection} from '~/lib/sanity';
import {hexToRgba} from '~/utils/styleHelpers';

import ShopByCollectionSSR from './ShopByCollectionSSR';
type Props = {
  module: ModuleShopByCollection;
};

function ShopByCollectionCSR({module}: Props) {
  const {moduleHeading, moduleSubHeading, collections} = module;

  const collectionPanelContents = (collection: ShopByCollectionCollection) => {
    let imageScaleFactor = 1;
    let imageMobileScaleFactor = 1;

    // 480 is the width requested in the Sanity description
    if (collection.panelImage && collection.panelImage.width < 480) {
      imageScaleFactor = 480 / collection.panelImage.width;
    }

    // 350 is the width requested in the Sanity description
    if (collection.panelImage && collection.panelImageMobile.width < 350) {
      imageMobileScaleFactor = 350 / collection.panelImageMobile.width;
    }

    // normalize placement value (default to "inside")
    const placement =
      collection.panelTextPlacement === 'above' ||
      collection.panelTextPlacement === 'below'
        ? collection.panelTextPlacement
        : 'inside';

    const HeadingAndButton = ({placement}: {placement: string}) =>
      (collection.panelHeading || collection.panelButtonText) && (
        <div
          className={clsx(
            'flex w-full flex-col justify-center gap-2 text-center text-primary',
            placement === 'inside' &&
              'sm:absolute sm:bottom-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:text-white',
          )}
        >
          {collection.panelHeading && (
            <span className="h2 text-[24px] sm:text-[34px] md:text-[24px] lg:text-[34px]">
              {collection.panelHeading}
            </span>
          )}
          {collection.panelButtonText && (
            <span
              className={`m-auto w-max px-3 py-3 text-xs uppercase ${
                !collection.panelInternalLink.hideUnderline
                  ? 'underline decoration-2 underline-offset-8'
                  : ''
              }`}
              style={{
                background: hexToRgba(
                  collection.panelInternalLink.buttonStyle?.background,
                ),
                color: collection.panelInternalLink.buttonStyle?.text,
              }}
            >
              {collection.panelButtonText}
            </span>
          )}
        </div>
      );

    return (
      <div className="flex flex-col items-center gap-2">
        {placement === 'above' && <HeadingAndButton placement={placement} />}

        {/* images */}
        {collection.panelImage && (
          <Image
            data={collection.panelImage}
            width={collection.panelImage.width * imageScaleFactor}
            height={collection.panelImage.height * imageScaleFactor}
            className={
              collection.panelImageMobile ? `hidden sm:block` : 'block'
            }
            alt={collection.panelImageAltText || collection.panelHeading}
          />
        )}
        {collection.panelImageMobile && (
          <Image
            data={collection.panelImageMobile}
            width={collection.panelImageMobile.width * imageMobileScaleFactor}
            height={collection.panelImageMobile.height * imageMobileScaleFactor}
            className="block sm:hidden"
            alt={collection.panelImageAltText || collection.panelHeading}
          />
        )}

        {(placement === 'inside' || placement === 'below') && (
          <HeadingAndButton placement={placement} />
        )}
      </div>
    );
  };

  return (
    <div className="page-width mb-5 flex flex-col gap-[30px]">
      {(moduleHeading || moduleSubHeading) && (
        <div className="flex flex-col items-center gap-4 text-center">
          {moduleHeading && <h2>{moduleHeading}</h2>}
          {moduleSubHeading && <span>{moduleSubHeading}</span>}
        </div>
      )}
      <div className="flex flex-col gap-5 md:flex-row md:gap-[6px]">
        {collections?.map((collection) => {
          const linkTo =
            collection.panelCollectionReference?.slug ||
            collection.panelInternalLink?.slug ||
            '';

          return (
            <div
              className="flex flex-col items-center sm:relative"
              key={collection._key}
            >
              {linkTo ? (
                <Link
                  to={linkTo}
                  className="hover-zoom flex flex-col gap-5"
                  prefetch="intent"
                >
                  {collectionPanelContents(collection)}
                </Link>
              ) : (
                <div className="flex">
                  {collectionPanelContents(collection)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ShopByCollection(props: any) {
  const isHydrated = useHydration();
  return (
    <>
      {isHydrated ? (
        <ShopByCollectionCSR {...props} />
      ) : (
        <ShopByCollectionSSR {...props} />
      )}
    </>
  );
}
