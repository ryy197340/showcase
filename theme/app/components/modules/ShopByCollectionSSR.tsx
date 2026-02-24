// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable hydrogen/prefer-image-component */
import {Link} from '~/components/Link';
import {ModuleShopByCollection, ShopByCollectionCollection} from '~/lib/sanity';
type Props = {
  module: ModuleShopByCollection;
};

// SSR note
// img tags are used instead of Image component to be SSR friendly
// prefetch="intent" is not useful for non-js crawlers, so it has been removed from the link component
// Link component in SSR renders to a <a> tag

export default function ShopByCollection({module}: Props) {
  const {moduleHeading, moduleSubHeading, collections} = module;
  const collectionPanelContents = (collection: ShopByCollectionCollection) => {
    return (
      <>
        {collection.panelImage && (
          <img
            data-src={collection.panelImage.url as string | undefined}
            alt={collection.panelImageAltText || collection.panelHeading}
          />
        )}
        {collection.panelImageMobile && (
          <img
            data-src={collection.panelImageMobile.url as string | undefined}
            alt={collection.panelImageAltText || collection.panelHeading}
          />
        )}
        {(collection.panelHeading || collection.panelButtonText) && (
          <div
            className={`flex w-full flex-col justify-center gap-5 text-center text-primary sm:absolute sm:bottom-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:text-white`}
          >
            {collection.panelHeading && (
              <span className="h2 text-[24px] sm:text-[34px] md:text-[24px] lg:text-[34px]">
                {collection.panelHeading}
              </span>
            )}
            {collection.panelButtonText && (
              <span className="button-link-border-b m-auto w-max after:bg-primary sm:after:bg-white">
                {collection.panelButtonText}
              </span>
            )}
          </div>
        )}
      </>
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
      <div className="flex flex-col gap-10 md:flex-row md:gap-[6px]">
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
