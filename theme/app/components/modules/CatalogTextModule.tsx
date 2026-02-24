import {useEffect, useState} from 'react';
import {JSX} from 'react/jsx-runtime';

import {CatalogTextModule as CatalogTextModuleType} from '~/lib/sanity';
import {SanityColorTheme} from '~/lib/theme';
import {DEFAULT_COLOR_THEME} from '~/lib/utils';

import PortableText from '../portableText/PortableText';

type Props = {
  content?: CatalogTextModuleType;
};

export default function CatalogTextModule({content}: Props) {
  const [sectionStyles, setSectionStyles] = useState({});
  const styles = content?.textContent?.styles;

  useEffect(() => {
    // Check if styles are defined and set them as section styles
    if (styles && styles.length > 0) {
      const sectionStyle = styles.join('; ');
      setSectionStyles(sectionStyle);
    }
  }, [styles]);

  if (!content) {
    return null; // Return null or handle the case when content is not available.
  }

  const {textContent} = content;
  const {colorTheme, textFields} = textContent;
  const {background, text} = colorTheme ? colorTheme : DEFAULT_COLOR_THEME;
  let heading: JSX.Element | undefined,
    subHeading: JSX.Element | undefined,
    description: JSX.Element | undefined;
  const textBoxWidth = '100%';
  textFields?.forEach(
    (textField: {
      _key: string;
      _type: string;
      subHeading?: string;
      heading?: string;
      description?: string;
      title?: string;
      colorTheme?: SanityColorTheme;
    }) => {
      switch (textField._type) {
        case 'subHeadingObject': {
          subHeading = (
            <span
              className="subHeadingObject"
              style={{
                background: textField.colorTheme?.background,
                color: textField.colorTheme?.text,
              }}
            >
              {/* {textField.subHeading} */}
              <PortableText
                blocks={textField.subHeading}
                centered
                className="pt-[5px] text-2xs uppercase tracking-[1px]"
                key={textField._key}
              />
            </span>
          );
          break;
        }
        case 'headingObject': {
          heading = (
            <span
              className="headingObject"
              style={{
                background: textField.colorTheme?.background,
                color: textField.colorTheme?.text,
              }}
            >
              <PortableText
                blocks={textField.heading}
                centered
                className={`mt-[20px] text-center`}
                key={textField._key}
              />
            </span>
          );
          break;
        }
        case 'descriptionObject': {
          description = (
            <span
              className="descriptionObject"
              style={{
                background: textField.colorTheme?.background,
                color: textField.colorTheme?.text,
              }}
            >
              <PortableText
                blocks={textField.description}
                centered
                key={textField._key}
                className="flex flex-col pb-[5px]"
              />
            </span>
          );
          break;
        }
        default:
          break;
      }
    },
  );

  // Define inline styles for the boxes

  const textBoxStyles = {
    backgroundColor: background,
    color: text,
    width: textBoxWidth,
  };
  const textBoxContent = (
    <div
      className={`page-width textBoxStyles textModule flex w-full flex-col items-center text-center md:w-1/2 md:justify-center ${
        sectionStyles !== undefined ? sectionStyles : ''
      }`}
      style={textBoxStyles}
    >
      <div
        className={`page-width flex flex-col flex-wrap justify-center px-10 text-center`}
      >
        {textFields?.map((field) => {
          return field._type === 'headingObject'
            ? heading
            : field._type === 'subHeadingObject'
            ? subHeading
            : field._type === 'descriptionObject'
            ? description
            : '';
        })}
      </div>
    </div>
  );

  return <>{textBoxContent}</>;
}
