// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable hydrogen/prefer-image-component */
import {v4 as uuidv4} from 'uuid';

import {Link} from '~/components/Link';
import {
  ImageWithText as ImageWithTextType,
  ImageWithText_TextFields,
} from '~/lib/sanity';
import {DEFAULT_COLOR_THEME} from '~/lib/utils';

import PortableText from '../portableText/PortableText';

// SRR notes
// removed Image and SanityImage components to make SSR friendly
// removed usematches
// removed use of memo, as it only applies client side and is not needed for SSR

type Props = {
  content?: ImageWithTextType;
  hero?: boolean;
};

const Heading = ({text, hero}) => {
  return hero ? (
    <h1 className="font-hoefler text-[44px]">{text}</h1>
  ) : (
    <h2 className="text-[34px]">{text}</h2>
  );
};
const SubHeading = ({text}) => {
  return (
    <span className="text-2xs uppercase tracking-[1px] sm:pt-0">{text}</span>
  );
};
const Description = ({text}) => {
  return text.split('\n').map((paragraph) => (
    <p className="text-sm leading-[20px]" key={`desc-${uuidv4()}`}>
      {paragraph}
    </p>
  ));
};
const LinkInternal = ({borderColor, textAlign, alignSelf, textField}) => {
  if (textField.slug) {
    return (
      <Link
        className="button-link-border-b max-w-max px-2 pb-1 text-xs uppercase tracking-[1.2px]"
        style={{borderColor, textAlign, alignSelf}}
        to={textField.slug}
        prefetch="intent"
      >
        {textField.title}
      </Link>
    );
  } else {
    return (
      <span
        className="button-link-border-b max-w-max px-2 pb-1 text-xs uppercase tracking-[1.2px]"
        style={{borderColor, textAlign, alignSelf}}
      >
        {textField.title}
      </span>
    );
  }
};

const RichTextBlock = ({richTextBody}) => {
  return (
    <div>
      {richTextBody &&
        richTextBody !== null &&
        richTextBody[0].children[0].text !== '' && (
          <PortableText blocks={richTextBody} centered />
        )}
    </div>
  );
};
const StringArrayObject = ({listType, strings}) => {
  const arrayListType = listType === 'bullet' ? 'list-disc' : 'list-decimal';

  return (
    <ul className={`pb-4 ${arrayListType}`}>
      {strings.map((string) => (
        <li
          key={`string-array-${uuidv4()}`}
          className="list-inside text-sm leading-[20px]"
        >
          {string}
        </li>
      ))}
    </ul>
  );
};

const ImageWithText = ({content, hero}: Props) => {
  if (!content) {
    return null;
  }
  const {imageContent, textContent, cssClass} = content;
  const {desktopImage, mobileImage, imageWidth, imageLeftOrRight, altText} =
    imageContent as {
      desktopImage?: {url: string; asset?: {_ref: string}};
      mobileImage?: {url: string; asset?: {_ref: string}};
      imageWidth: string;
      imageLeftOrRight: string;
      altText: string;
    };
  const {colorTheme, textFields, textLeftOrCenter, textOverlay} = textContent;
  const {background, text} = colorTheme ? colorTheme : DEFAULT_COLOR_THEME;
  let url: string | undefined;
  const textBoxWidth = 100 - parseFloat(imageWidth.split('%')[0]) + '%';
  const overlayBackgroundTransparency =
    content.textContent.textOverlay?.backgroundTransparency ===
    '100% transparent background'
      ? '00'
      : content.textContent.textOverlay?.backgroundTransparency ===
        '50% transparent background'
      ? '7d'
      : '';
  const textAlignmentClass =
    textLeftOrCenter === 'center'
      ? 'text-center md:justify-center'
      : 'text-left justify-start';
  const renderTextField = (textField: ImageWithText_TextFields) => {
    switch (textField._type) {
      case 'subHeadingObject':
        return <SubHeading text={textField.subHeading} key={textField._key} />;
      case 'headingObject':
        return (
          <Heading text={textField.heading} hero={hero} key={textField._key} />
        );
      case 'descriptionObject':
        return (
          <Description text={textField.description} key={textField._key} />
        );
      case 'stringArrayObject': {
        const arrayStrings = textField.strings[0]
          .split('\n')
          .filter((str: string) => str.trim() !== '');

        return (
          <StringArrayObject
            key={textField._key}
            listType={textField.listType}
            strings={arrayStrings}
          />
        );
      }
      case 'linkInternal':
        return (
          <LinkInternal
            key={textField._key}
            borderColor={text}
            textAlign={textLeftOrCenter}
            alignSelf={textLeftOrCenter}
            textField={textField}
          />
        );
      case 'module.richText':
        return (
          <RichTextBlock
            key={textField._key}
            richTextBody={textField.richTextBody}
          />
        );
      default:
        return null;
    }
  };
  const imageBoxStyles = {
    width: imageWidth,
  };
  const textBoxWidthStyles = {
    width: `${textOverlay?.textOverlayBoolean ? imageWidth : textBoxWidth}`,
  };

  const textBoxColorStyles = {
    backgroundColor: `${background}${overlayBackgroundTransparency}`,
    color: text,
  };
  const textBoxContent = (
    <div
      className={`textBoxStyles flex flex-col items-center ${
        textOverlay?.textOverlayBoolean
          ? `absolute h-full justify-${textOverlay.textOverlayPosition} text-center`
          : `relative w-full justify-center md:w-1/2 ${textAlignmentClass}`
      }`}
      style={textBoxWidthStyles}
    >
      <div
        className={`flex flex-col gap-5 align-middle ${textAlignmentClass} md:w-3/4 ${
          hero === true
            ? 'py-[47px] md:py-[50px]'
            : 'minHeight-[160px] p-5 md:px-0'
        }`}
        style={textBoxColorStyles}
      >
        {textFields ? textFields.map(renderTextField) : ''}
      </div>
    </div>
  );
  const imageWithTextContent = (
    <div
      className={`page-width image-with-text-content ${
        hero === true ? 'md:pb-0' : ''
      } ${cssClass ? `${cssClass}` : ''}`}
    >
      <div
        className={`relative flex w-full flex-col ${
          imageLeftOrRight === 'right' ? 'md:flex-row-reverse' : ''
        } flex-wrap md:flex-row ${
          !textOverlay?.textOverlayBoolean
            ? hero !== true
              ? 'md:px-10 lg:px-20'
              : 'lg:px-10'
            : ''
        } md:pt-0`}
      >
        <div
          className={`imageBoxStyles w-full ${
            hero !== true ? 'px-5 md:px-0' : ''
          } ${!textOverlay?.textOverlayBoolean ? 'md:w-1/2' : 'w-full'}`}
          style={imageBoxStyles}
        >
          {desktopImage?.url && mobileImage?.url ? (
            <picture className="flex h-full w-full">
              <source media="(max-width: 767px)" srcSet={mobileImage.url} />
              <source media="(min-width: 768px)" srcSet={desktopImage.url} />
              <img src={desktopImage.url} alt={altText} />
            </picture>
          ) : desktopImage ? (
            <div className="relative h-[200px]">
              <img src={desktopImage?.asset?._ref} alt={altText} />
            </div>
          ) : mobileImage ? (
            <div className="relative">
              <img src={mobileImage?.asset?._ref} alt={altText} />
            </div>
          ) : (
            <img src={desktopImage?.url} alt={altText} />
          )}
        </div>
        {textBoxContent}
      </div>
    </div>
  );

  return url ? (
    <Link to={url} prefetch="intent">
      {imageWithTextContent}
    </Link>
  ) : (
    <>{imageWithTextContent}</>
  );
};

export default ImageWithText;
