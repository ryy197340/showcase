import {useLocation, useMatches} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';
import {v4 as uuidv4} from 'uuid';

import type {ThreeImagesModule} from '~/lib/sanity';

import SanityImage from '../media/SanityImage';
type Props = {
  module?: ThreeImagesModule;
};

export default function ThreeImagesModule({module}: Props) {
  const [root] = useMatches();
  const location = useLocation();
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;
  const isLikelyBlogPage = location.pathname.includes('/blog/');
  if (!module) {
    return null; // Return null if the module or images are missing or not equal to 3.
  }
  return (
    <div className="page-width w-full px-5 md:px-0" key="threeImagesModule">
      <div
        className={`flex justify-center gap-[3px] md:gap-[6px]${
          isLikelyBlogPage ? '' : ' lg:px-[156px]'
        }`}
      >
        {module.images?.map((image, index) => (
          <div
            key={image._key || uuidv4()} // Use image _key if available, or generate a UUID.
            className={clsx(
              'flex w-1/3 items-center justify-center overflow-hidden',
            )}
          >
            {image.url ? (
              <Image
                src={image.url} // Assuming there's a URL field in your image schema.
                alt={image.altText || ''} // Assuming there's an altText field in your image schema.
                className="h-auto min-h-full min-w-full max-w-full object-cover"
                loading={module.imageLoading === 'Lazy' ? 'lazy' : 'eager'}
              />
            ) : (
              <div className="relative h-[300px]">
                <SanityImage
                  alt={image?.altText}
                  crop={image?.crop}
                  dataset={sanityDataset}
                  hotspot={image?.hotspot}
                  layout="fill"
                  objectFit="cover"
                  projectId={sanityProjectID}
                  sizes="100vw"
                  src={image?.asset?._ref}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
