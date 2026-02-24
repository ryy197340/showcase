import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';
import {v4 as uuidv4} from 'uuid';

import Link from '~/components/elements/Link';
import {useHydration} from '~/hooks/useHydration';
import type {FourImagesModule} from '~/lib/sanity';

import FourImagesModuleSSR from './FourImagesModuleSSR';

type Props = {
  module?: FourImagesModule;
};

function FourImagesModuleCSR({module}: Props) {
  if (!module) {
    return null; // Return null if the module or images are missing or not equal to 4.
  }
  return (
    <div
      className="page-width flex w-full flex-col items-center px-5 md:px-0"
      key="fourImagesModule"
    >
      {module.title && (
        <h2 className="font-normal text-base font-primary block min-h-10 text-center md:text-center md:text-2xl">
          {module.title}
        </h2>
      )}
      {module.subheading && (
        <h4 className="font-primary sm:text-l block pb-4 text-center">
          {module.subheading}
        </h4>
      )}
      <div className="grid max-w-[320px] grid-cols-2 justify-center gap-[10px] md:max-w-full md:grid-cols-4 lg:px-[10%]">
        {module.images?.map((image, index) => (
          <div
            key={image._key || uuidv4()}
            className={clsx('flex-0 flex items-center justify-center')}
          >
            {image.link ? (
              <Link
                link={image.link}
                className="flex w-36 flex-col text-center text-md leading-[2rem] text-primary hover:underline md:w-64"
              >
                <Image
                  src={image.image.url}
                  alt={image.altText || ''}
                  className="h-36 min-h-full max-w-full object-fill md:h-full"
                  loading={module.imageLoading === 'Lazy' ? 'lazy' : 'eager'}
                />
                {!image.hideCta ? image.link.title : ''}
              </Link>
            ) : (
              <Image
                src={image.image.url}
                alt={image.altText || ''}
                className="h-36 min-h-full max-w-full object-fill md:h-64 md:w-64"
                loading={module.imageLoading === 'Lazy' ? 'lazy' : 'eager'}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FourImagesModule(props: any) {
  const isHydrated = useHydration();
  return (
    <>
      {isHydrated ? (
        <FourImagesModuleCSR {...props} />
      ) : (
        <FourImagesModuleSSR {...props} />
      )}
    </>
  );
}
