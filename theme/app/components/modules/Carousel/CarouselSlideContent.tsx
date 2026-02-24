import {useLocation} from '@remix-run/react';
import {memo} from 'react';

import {Slide, VideowiseHTML} from '~/lib/sanity/types';

import {getTextAlignClass, slideTextColor, TextElement} from './utils';

type Props = {
  slide: Slide | VideowiseHTML;
  index: number;
};

const CarouselSlideContent = ({slide, index}: Props) => {
  const location = useLocation();
  const isLikelyHomepage =
    !location.pathname.includes('blog') &&
    !location.pathname.includes('pages') &&
    !location.pathname.includes('products') &&
    !location.pathname.includes('collections');
  if (slide._type === 'videoSlide') {
    const {html, mobileHTML} = slide;

    return (
      <div className="html-slide h-full w-full">
        {html && (
          <div
            dangerouslySetInnerHTML={{__html: html}}
            className="html-content hidden md:block"
          />
        )}
        {mobileHTML && html && (
          <div
            dangerouslySetInnerHTML={{__html: mobileHTML}}
            className="html-content block md:hidden"
          />
        )}
      </div>
    );
  } else {
    const {
      additionalText,
      heading,
      subHeading,
      textColor,
      link,
      verticalOrientation,
      hideTitle,
    } = slide;

    const color = textColor ? slideTextColor(textColor) : '#13294e';
    const textAlignClass = verticalOrientation
      ? getTextAlignClass(verticalOrientation)
      : 'center';

    return (
      <div
        className={`flex h-full w-full flex-col gap-5 px-[40px] py-[30px] text-center sm:py-[50px] md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:py-[100px] lg:py-[200px] xl:whitespace-pre justify-${textAlignClass}`}
      >
        {subHeading && (
          <TextElement
            color={color}
            className="text-2xs font-semibold uppercase tracking-[1px]"
          >
            {subHeading}
          </TextElement>
        )}
        {heading && (
          <TextElement
            color={color}
            className="h2 font-hoefler text-[40px] leading-[52px] sm:text-[44px]"
            h1={index === 0 && isLikelyHomepage}
          >
            {heading[0].children[0].text}
          </TextElement>
        )}
        {additionalText && (
          <TextElement
            color={color}
            className="font-gotham text-sm leading-[20px]"
          >
            {additionalText[0].children[0].text}
          </TextElement>
        )}
        {link && (
          <p
            className={`button-link-border-b-mod mt-5 px-[10px] sm:mt-0 ${
              hideTitle ? 'hidden' : ''
            }`}
            style={{
              color,
              borderBottom: `4px solid ${color}`,
            }}
          >
            {link.title}
          </p>
        )}
      </div>
    );
  }
};

export default memo(CarouselSlideContent);
