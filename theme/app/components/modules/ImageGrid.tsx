import {Image} from '@shopify/hydrogen';
import {memo} from 'react';

import {ImageGrid as ImageGridType, ImageGridItem} from '~/lib/sanity/types';

import {Link} from '../Link';

type Props = {
  module: ImageGridType;
};

const ImageComponent = memo(({data}: {data: ImageGridItem}) => {
  return (
    <>
      <Image
        src={data.image.url}
        alt={data.altText}
        height={data.image.height}
        width={data.image.width}
        className={`h-full w-full object-cover ${
          data.imageMobile ? 'hidden md:block' : 'block'
        }`}
      />
      {data.imageMobile && (
        <Image
          src={data.imageMobile.url}
          alt={data.altText}
          height={data.imageMobile.height}
          width={data.imageMobile.width}
          className="h-full w-full object-cover md:hidden"
        />
      )}
    </>
  );
});

const GridItem = memo(({data}: {data: ImageGridItem}) => {
  if (data.link?.slug) {
    return (
      <div className="gridItem w-full text-center">
        <Link to={data.link.slug} prefetch="intent">
          <ImageComponent data={data} />
        </Link>

        <Link
          to={data.link?.slug ? data.link.slug : ''}
          className={`text-sm text-primary hover:underline ${
            data.hideCta ? 'hidden' : ''
          }`}
        >
          {data.link?.title}
        </Link>
      </div>
    );
  } else {
    return <ImageComponent data={data} />;
  }
});

const ImageGrid = memo(({module}: Props) => {
  const numberOfImages = module.images.length;
  return (
    <div className="flex flex-col gap-[15px] md:flex-row">
      {module.sidebar?.sidebarEnable && (
        <div className="mx-10 flex flex-col items-center justify-center gap-4 md:w-1/6 md:items-start">
          {module.sidebar.sidebarHeading && (
            <h2 className="text-center md:text-left">
              {module.sidebar.sidebarHeading}
            </h2>
          )}
          {module.sidebar.sidebarDescription && (
            <span className="text-center text-sm md:text-left">
              {module.sidebar.sidebarDescription}
            </span>
          )}
          {module.sidebar.sidebarLinkText?.slug && (
            <span>
              <Link
                to={module.sidebar.sidebarLinkText.slug}
                prefetch="intent"
                className="button-link-border-b"
              >
                {module.sidebar.sidebarLinkText.title}
              </Link>
            </span>
          )}
        </div>
      )}

      <div
        className={`grid grow items-start justify-center gap-2 grid-cols-${
          numberOfImages >= 2 ? '2' : '1'
        } grid-rows-${
          numberOfImages >= 2
            ? numberOfImages > 4
              ? `${Math.ceil(Math.sqrt(numberOfImages)) - 1}`
              : `${numberOfImages / 2}`
            : '4'
        } md:grid-cols-${
          numberOfImages >= 4
            ? numberOfImages % 3 === 0
              ? '3'
              : '4'
            : numberOfImages
        } md:grid-rows-${
          numberOfImages > 4
            ? `${Math.ceil(Math.sqrt(numberOfImages) - 1)}`
            : '1'
        } px-1 md:px-0`}
      >
        {module.images.map((data, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <GridItem data={data} key={`${data._key}-${index}`} />
        ))}
      </div>
    </div>
  );
});

export default memo(ImageGrid);
