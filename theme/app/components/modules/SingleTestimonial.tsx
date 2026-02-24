import {stegaClean} from '@sanity/client/stega';
import {Image} from '@shopify/hydrogen';

import {SingleTestimonial as SingleTestimonialType} from '~/lib/sanity';
import {DEFAULT_COLOR_THEME} from '~/lib/utils';

type Props = {
  module?: SingleTestimonialType;
  hero?: boolean;
};

export default function SingleTestimonial({module, hero}: Props) {
  if (!module) {
    return null; // Return null or handle the case when content is not available.
  }

  const {imagePanel, imagePanelMobile, altText, quotationPanel} = module;
  let quoteTextFields;
  if (quotationPanel?.quoteTextFields)
    quoteTextFields = quotationPanel.quoteTextFields;
  let colorTheme;
  quotationPanel?.colorTheme
    ? (colorTheme = quotationPanel.colorTheme)
    : (colorTheme = DEFAULT_COLOR_THEME);

  // Define inline styles for the boxes
  const textBoxContent = (
    <div
      className={`flex w-full flex-col items-center px-5 text-center md:w-3/5 md:justify-center`}
      style={{background: colorTheme.background, color: colorTheme.text}}
    >
      <div
        className={`flex flex-col items-center px-5 text-center md:justify-center ${
          hero === true
            ? 'pb-[50px] pt-[46px]'
            : 'minHeight-[160px] pb-9 pt-[34px] md:px-[95px]'
        }`}
      >
        <div className="font-hoefler">
          <p className="font-hoefler text-[30px] font-bold md:text-[60px]">“</p>
          {quoteTextFields?.quote && (
            <p className="pb-5 text-lg2 italic leading-[30px]">
              {quoteTextFields.quote}
            </p>
          )}
          {quoteTextFields?.name && (
            <p className="text-sm uppercase tracking-[1.4px]">
              {quoteTextFields.name}
            </p>
          )}
          {quoteTextFields?.jobTitle && (
            <p className="pt-2 text-2xs">{quoteTextFields.jobTitle}</p>
          )}
        </div>
      </div>
    </div>
  );
  const imageWithTextContent = (
    <div className={`page-width image-with-text-content px-5 md:px-10`}>
      <div className={`flex w-full flex-col`}>
        <div className="imageBoxStyles flex w-full flex-col-reverse md:flex-row">
          {textBoxContent}
          <div className="w-full md:w-2/5">
            <Image
              src={imagePanel.url}
              className={`w-full ${
                hero === true
                  ? 'min-h-[306px] md:h-[400px] lg:h-[500px]'
                  : 'min-h-[200px]'
              } md:min-[300px] min-h-full min-w-full object-cover object-center lg:min-h-[300px] ${
                imagePanelMobile ? 'hidden md:block' : 'block'
              }`}
              crop="center"
              sizes="100%"
              loading="eager"
              height={imagePanel.height}
              width={imagePanel.width}
              alt={stegaClean(altText)}
            />
            {imagePanelMobile && (
              <Image
                src={imagePanelMobile.url}
                className={`w-full ${
                  hero === true ? 'min-h-[306px] md:h-[400px]' : 'min-h-[200px]'
                } md:min-[300px] min-h-full min-w-full object-cover object-center md:hidden`}
                crop="center"
                sizes="100%"
                loading="eager"
                height={imagePanelMobile.height}
                width={imagePanelMobile.width}
                alt={stegaClean(altText)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return <>{imageWithTextContent}</>;
}
