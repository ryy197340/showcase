import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';
import {memo} from 'react';

import Button, {squareButtonStyles} from '~/components/elements/Button';
import {Link} from '~/components/Link';
import {PDPRequestACatalog} from '~/lib/sanity';

import PortableText from '../portableText/PortableText';

type Props = {
  pdpRequestACatalog: PDPRequestACatalog | undefined;
};

function RequestACatalog({pdpRequestACatalog}: Props) {
  return (
    <div className="bg-messageBlue">
      <div
        className={clsx(
          'page-width grid items-center gap-2 py-8 md:grid-cols-2 md:py-8', //
          'grid-cols-1',
        )}
      >
        {pdpRequestACatalog?.image?.url && (
          <div className="hidden md:flex">
            <Image
              src={pdpRequestACatalog.image.url}
              className="w-full transform bg-contain bg-center object-contain object-center ease-in-out md:p-5 lg:p-15"
              crop="center"
              sizes="100%"
            />
          </div>
        )}
        <div className="px-5 lg:px-12">
          {pdpRequestACatalog?.heading && (
            <h2 className="pb-[14px]">{pdpRequestACatalog?.heading}</h2>
          )}
          {pdpRequestACatalog?.RAC_richText &&
            pdpRequestACatalog?.RAC_richText !== null &&
            pdpRequestACatalog?.RAC_richText[0].children[0].text !== '' && (
              <PortableText
                blocks={pdpRequestACatalog?.RAC_richText}
                centered
                className="body-content mx-auto w-full"
              />
            )}

          {/* {messageSplit && (
            <div>
              {messageSplit.map((el: string) => {
                if (el === '') {
                  return <br className="my-4" key={uuidv4()}></br>;
                } else {
                  return (
                    <div className="pb-[18px]" key={uuidv4()}>
                      <p className="text-[14px] leading-[20px]">{el}</p>
                    </div>
                  );
                }
              })}
            </div>
          )} */}
          <div className="flex flex-col gap-2 md:flex-col md:gap-4 lg:flex-row lg:pt-8">
            {pdpRequestACatalog?.virtualCatalogLink && (
              <div>
                <Link
                  to={`${
                    pdpRequestACatalog.virtualCatalogLink.url
                      ? pdpRequestACatalog.virtualCatalogLink.url
                      : pdpRequestACatalog.virtualCatalogLink.slug
                  }`}
                >
                  <Button
                    className={clsx([
                      squareButtonStyles({mode: 'outline', tone: 'default'}),
                      'w-full lg:w-auto',
                    ])}
                    type="button"
                  >
                    {pdpRequestACatalog.virtualCatalogLink.title}
                  </Button>
                </Link>
              </div>
            )}
            {pdpRequestACatalog?.requestACatalog && (
              <div>
                <Link to={`${pdpRequestACatalog.requestACatalog.slug}`}>
                  <Button
                    className={clsx([
                      squareButtonStyles({mode: 'default', tone: 'default'}),
                      'w-full lg:w-auto',
                    ])}
                    type="button"
                  >
                    {pdpRequestACatalog.requestACatalog.title}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(RequestACatalog);
