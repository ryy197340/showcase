import {Image} from '@shopify/hydrogen';

import {PDPAMessageFromJMcL} from '~/lib/sanity';
type Props = {
  pdpMessageFromJMCL: PDPAMessageFromJMcL | undefined;
};
import {memo} from 'react';

import PortableText from '../portableText/PortableText';

function AMessageFromJMCL({pdpMessageFromJMCL}: Props) {
  return (
    <div className="clear-both hidden lg:block">
      <div className="w-full bg-messageBlue">
        <div className="md:page-width grid w-full grid-cols-1 items-center gap-2 md:grid-cols-2">
          {(pdpMessageFromJMCL?.heading ||
            pdpMessageFromJMCL?.MFJMCL_richText) && (
            <div className="px-12 md:px-5 md:py-15 lg:px-12">
              {pdpMessageFromJMCL?.heading && (
                <h2 className="pb-4">{pdpMessageFromJMCL.heading}</h2>
              )}
              {/* Body */}
              {pdpMessageFromJMCL?.MFJMCL_richText &&
                pdpMessageFromJMCL?.MFJMCL_richText !== null &&
                pdpMessageFromJMCL?.MFJMCL_richText[0].children[0].text !==
                  '' && (
                  <PortableText
                    blocks={pdpMessageFromJMCL?.MFJMCL_richText}
                    centered
                    className="body-content mx-auto w-full"
                  />
                )}
            </div>
          )}
          {pdpMessageFromJMCL?.image?.url && (
            <div>
              <Image
                src={pdpMessageFromJMCL.image.url}
                className="w-full transform bg-contain bg-center object-contain object-center p-15 ease-in-out md:p-5 lg:p-15"
                crop="center"
                sizes="100%"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(AMessageFromJMCL);
