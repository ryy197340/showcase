import {Image} from '@shopify/hydrogen';

import {Link} from '~/components/Link';
import type {BackToLink} from '~/lib/sanity';

type Props = {
  content: BackToLink;
  hero?: boolean;
};

export default function BackToLink({content}: Props) {
  const {internalLinks, image} = content;
  return (
    <div
      className="page-width paddingOverride w-full px-5 pt-[25px] md:px-10 md:pt-[45px]"
      key="calloutButton"
      style={{paddingLeft: '8%'}}
    >
      <div className="mr-auto flex flex-col" style={{width: '47%'}}>
        {/* Link */}
        {internalLinks && (
          <div className="flex flex-row items-center text-left md:w-3/4">
            <Link
              className="flex"
              to={`${
                internalLinks._type == 'linkInternal' && internalLinks.slug
              }`}
            >
              <Image
                src={image.url}
                sizes="100%"
                width={image.width}
                height={image.height}
                alt={image.altText}
                className="inline-block"
              />
              <p
                className="inline-block text-2xs text-primary"
                style={{lineHeight: '24px'}}
              >
                {internalLinks.title}
              </p>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
