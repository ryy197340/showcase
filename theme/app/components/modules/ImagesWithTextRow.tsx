import {useLocation, useMatches} from '@remix-run/react';
import clsx from 'clsx';
import {v4 as uuidv4} from 'uuid';

import {useHydration} from '~/hooks/useHydration';
import type {ImagesWithTextRow} from '~/lib/sanity';

import ImagesWithTextRowSSR from './ImagesWithTextRowSSR';
import ImageWithText from './ImageWithText';

type Props = {
  module?: ImagesWithTextRow;
};

function ImagesWithTextRowCSR({module}: Props) {
  const [root] = useMatches();
  const location = useLocation();
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;
  const isLikelyBlogPage = location.pathname.includes('/blog/');

  if (!module) {
    return null;
  }

  return (
    <div className="page-width w-full px-5 md:px-0" key="imagesWithTextRow">
      <div
        className={`flex flex-col justify-center gap-[3px] md:flex-row md:gap-[6px] ${
          isLikelyBlogPage ? '' : 'lg:px-[156px]'
        }`}
      >
        {module.images?.map((image) => (
          <div
            key={image._key || uuidv4()}
            className={clsx(
              'flex w-full items-center justify-center overflow-hidden md:w-1/2',
            )}
          >
            {image.imageContent && (
              <div className="relative h-full w-full">
                <ImageWithText content={image} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ImagesWithTextRowWrapper(props: any) {
  const isHydrated = useHydration();
  return (
    <>
      {isHydrated ? (
        <ImagesWithTextRowCSR {...props} />
      ) : (
        <ImagesWithTextRowSSR {...props} />
      )}
    </>
  );
}
