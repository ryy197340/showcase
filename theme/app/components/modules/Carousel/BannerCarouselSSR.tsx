// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable hydrogen/prefer-image-component */
// Using standard img tags instead of Image component for better SSR compatibility
import {Carousel} from '~/lib/sanity';

import {slideTextColor, TextElement} from './utils';

type Props = {
  content: Carousel;
};

//SSR note:
// removing carousel functionality to improve SSR compatibility

const BannerCarousel = ({content}: Props) => {
  const {slides} = content;

  return (
    <div className="flex flex-col gap-[6px]">
      {/* slides */}
      {slides?.map((slide, index) => {
        const color = slide.textColor
          ? slideTextColor(slide.textColor)
          : '#13294e';
        return (
          <div key={index}>
            {slide.subHeading && (
              <TextElement
                color={color}
                className="text-2xs font-semibold uppercase tracking-[1px]"
              >
                {slide.subHeading}
              </TextElement>
            )}
            {slide.heading && (
              <TextElement
                color={color}
                className="h2 font-hoefler text-[40px] leading-[52px] sm:text-[44px]"
              >
                {slide.heading[0]?.children[0]?.text || ''}
              </TextElement>
            )}
            {slide.additionalText && (
              <TextElement
                color={color}
                className="font-gotham text-sm leading-[20px]"
              >
                {slide.additionalText[0]?.children[0]?.text || ''}
              </TextElement>
            )}
            {slide.link?.slug && slide.link?.title && (
              <a href={slide.link.slug}>{slide.link.title}</a>
            )}
            {slide.html && (
              <div
                dangerouslySetInnerHTML={{__html: slide.html}}
                className="html-content"
              />
            )}
            {slide.images &&
              slide.images?.map((slideImage, idx) => (
                <img
                  key={idx}
                  src={`${slideImage.image?.url}?auto=format` || ''}
                  alt={slideImage.image?.altText || 'Slide image'}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
};

export default BannerCarousel;
