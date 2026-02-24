import clsx from 'clsx';
import {v4 as uuidv4} from 'uuid';

import type {ImagesWithTextRow} from '~/lib/sanity';

import ImageWithText from './ImageWithText';

type Props = {
  module?: ImagesWithTextRow;
};

//SSR note
// no use of useLocation, useMatches, useEffect
// location is not used to update className string

export default function ImagesWithTextRowSSR({module}: Props) {
  if (!module) {
    return null;
  }

  return (
    <div className="page-width w-full px-5 md:px-0" key="imagesWithTextRow">
      <div
        className={`flex flex-col justify-center gap-[3px] md:flex-row md:gap-[6px] lg:px-[156px]`}
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
