import {stegaClean} from '@sanity/client/stega';
import {useEffect, useState} from 'react';

import SanityImage from '~/components/media/SanityImage';
import {SanityAssetImage} from '~/lib/sanity';

type DropdownSanityImageParams = {
  isDropdownOpen?: boolean;
  image: SanityAssetImage;
  altText: string;
  imageLoading: string;
  sanityDataset: string;
  sanityProjectID: string;
  title?: string;
  hideTitle?: boolean;
  textOverlay?: boolean;
  type?: string;
  font?: string;
  textAlign?: string;
  disableHoverZoom?: boolean;
  imageAspectRatio?: string;
  largeText?: string;
  hideUnderline?: boolean;
};

const textOverlayClassNames =
  'absolute inset-0 flex items-center justify-center text-white text-[12px] lg:text-[15px] text-center font-hoefler font-regular lg:bg-neutral-500/50 lg:hover:bg-[#40404040] lg:hover:underline transition-colors duration-500 px-0.5';

const fontClassMap: Record<string, string> = {
  gothamBold: 'topLevelNavText font-bold mt-[3px] leading-[130%] text-[12px]',
  gothamRegular: 'normal-case font-regular mt-[3px] leading-[130%] text-[14px]',
  hoefler: 'font-hoefler mt-[3px] font-regular text-[14px] leading-[130%]',
};

const DropdownSanityImage = ({
  isDropdownOpen,
  image,
  altText,
  imageLoading,
  sanityDataset,
  sanityProjectID,
  title,
  hideTitle,
  textOverlay,
  type,
  font,
  textAlign,
  disableHoverZoom,
  imageAspectRatio,
  largeText,
  hideUnderline,
}: DropdownSanityImageParams) => {
  const showOverlay = title && textOverlay === true;
  const [didImageRender, setDidImageRender] = useState(false);

  useEffect(() => {
    if (isDropdownOpen) {
      setDidImageRender(true);
    }
  }, [isDropdownOpen]);

  return (
    <>
      <div
        className={`${
          !disableHoverZoom ? 'hover-zoom' : 'overflow-hidden'
        } relative w-full ${
          type === 'FeaturedImageGrid' && imageAspectRatio
            ? imageAspectRatio
            : type === 'FeaturedImageGrid' && !imageAspectRatio
            ? 'aspect-square'
            : ''
        }`}
      >
        {didImageRender && (
          <SanityImage
            className={`max-h-[25%] w-full md:max-h-[none] ${
              type === '2xfeaturedImage' ? 'object-cover' : 'object-contain'
            }`}
            loading={imageLoading}
            alt={altText}
            crop={image.crop}
            dataset={sanityDataset}
            hotspot={image.hotspot}
            layout="responsive"
            objectFit="cover"
            projectId={sanityProjectID}
            sizes="600px"
            src={image.asset?._ref}
            width={image.width}
            height={image.height}
          />
        )}
        {showOverlay && (
          <span className={`${textOverlayClassNames}`}>{title}</span>
        )}
      </div>
      {largeText && (
        <div className="mt-2 text-left">
          <span
            className={`font-hoefler text-[20px] font-regular ${
              textAlign ? stegaClean(textAlign) : 'text-center'
            }`}
          >
            {stegaClean(largeText)}
          </span>
        </div>
      )}
      {title && !hideTitle && !textOverlay && (
        <div
          className={`${
            fontClassMap[stegaClean(font)] ?? fontClassMap['hoefler']
          } ${textAlign ? stegaClean(textAlign) : 'text-center'} ${
            !hideUnderline ? 'underline' : ''
          } mb-2 text-wrap px-1 leading-none md:mb-0 md:px-0 md:leading-[130%]`}
        >
          {title}
        </div>
      )}
    </>
  );
};

export default DropdownSanityImage;
