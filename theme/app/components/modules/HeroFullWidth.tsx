import {useMatches} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import React from 'react';
import {v4 as uuidv4} from 'uuid';

import {Link} from '~/components/Link';
import {HeroFullWidth as HeroFullWidthType} from '~/lib/sanity';

type Props = {
  module?: HeroFullWidthType;
};

const HeroFullWidth = React.memo(({module}: Props) => {
  if (!module) {
    return null;
  }

  const {
    title,
    subtitle,
    colorTheme,
    textLeftOrRight,
    image,
    imageMobile,
    link,
    link2,
    linkColorTheme1,
    linkColorTheme2,
    altText,
  } = module;

  const textBoxWidth = '50%';
  const textAlignmentClass = textLeftOrRight === 'left' ? 'left-0' : 'right-0';

  return (
    <div className={`page-width image-with-text-content`}>
      <div className={`relative flex w-full flex-col items-center`}>
        <div className="w-full">
          {/* Image Section */}
          {image && (
            <div className="relative h-[460px]">
              <Image
                src={image.url}
                alt={altText ? altText : ''}
                height={image.height}
                width={image.width}
                className={`w-full object-cover${
                  imageMobile ? ' block md:hidden' : 'block'
                }`}
                loading="eager"
              />
            </div>
          )}
          {imageMobile && (
            <div className="relative h-[460px]">
              <Image
                src={imageMobile.url}
                alt={altText ? altText : ''}
                height={imageMobile.height}
                width={imageMobile.width}
                className="w-full object-cover"
                loading="eager"
              />
            </div>
          )}

          {/* Mobile Image Section (if needed) */}
          {/* Use similar logic as above for mobileImage */}
        </div>

        <div
          className={`absolute z-10 w-full md:w-1/2 ${textAlignmentClass} flex items-center justify-center px-5 md:px-0`}
          style={{
            top: '50%',
            color: `${colorTheme?.text ? colorTheme.text : 'text-primary'}`,
            transform: 'translateY(-50%)',
          }}
        >
          {/* Text Section */}
          <div
            className={`textBoxStyles flex w-full flex-col text-center`}
            style={{
              //backgroundColor: background,
              //color: text,
              width: textBoxWidth,
            }}
          >
            <div className={`flex flex-col gap-5 align-middle`}>
              <h3
                className="font-hoefler text-[40px] md:text-[44px]"
                style={{lineHeight: '44px'}}
              >
                {title}
              </h3>
              <p>{subtitle}</p>
              <div className="flex flex-row gap-2">
                {link && (
                  <Link
                    className="flex h-[48px] w-full items-center justify-center text-sm"
                    to={`${link._type == 'linkInternal' && link.slug}`}
                    key={uuidv4()}
                    style={{
                      background: linkColorTheme1?.background,
                      color: linkColorTheme1?.text,
                    }}
                  >
                    {link.title}
                  </Link>
                )}
                {link2 && (
                  <Link
                    className="flex w-full items-center justify-center text-sm"
                    to={`${link2._type == 'linkInternal' && link2.slug}`}
                    key={uuidv4()}
                    style={{
                      background: linkColorTheme2?.background,
                      color: linkColorTheme2?.text,
                    }}
                  >
                    {link2.title}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default HeroFullWidth;
