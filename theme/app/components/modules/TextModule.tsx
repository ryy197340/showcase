import {v4 as uuidv4} from 'uuid';

import {Link} from '~/components/Link';
import {TextModule as TextModuleType} from '~/lib/sanity';
import {DEFAULT_COLOR_THEME} from '~/lib/utils';
import {hexToRgba} from '~/utils/styleHelpers';

type Props = {
  content?: TextModuleType;
  hero?: boolean;
};

export default function TextModule({content, hero}: Props) {
  if (!content) return null;

  const {textContent} = content;
  const {colorTheme, textFields, styles} = textContent;
  const {background, text} = colorTheme || DEFAULT_COLOR_THEME;

  const inlineCMSStyles =
    styles && styles.length
      ? Object.fromEntries(
          styles
            .map((style: string) => {
              const [key, value] = style.split(':').map((s) => s.trim());
              return key && value ? [key, value] : null;
            })
            .filter(Boolean) as [string, string][],
        )
      : {};

  const textBoxStyles = {
    backgroundColor: background,
    color: text,
    width: '100%',
    ...inlineCMSStyles,
  };

  const headerTags: {[key: string]: React.ElementType} = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
  };

  return (
    <div
      className="page-width textBoxStyles textModule flex w-full flex-col items-center text-center md:w-1/2 md:justify-center"
      style={textBoxStyles}
    >
      <div className="page-width flex flex-col flex-wrap justify-center px-10 pb-5 pt-1 text-center">
        {textFields?.map((textField) => {
          switch (textField._type) {
            case 'subHeadingObject':
              return (
                <span
                  key={textField._key}
                  className="text-2xs uppercase tracking-[1px]"
                  style={{
                    background: hexToRgba(textField.colorTheme?.background),
                    color: textField.colorTheme?.text,
                  }}
                >
                  {textField.subHeading}
                </span>
              );

            case 'headingObject': {
              const HeaderTag =
                textField.headerLevel && headerTags[textField.headerLevel]
                  ? headerTags[textField.headerLevel]
                  : hero
                  ? 'h1'
                  : 'h2';

              const fontSizeClass =
                HeaderTag === 'h1'
                  ? 'text-[44px] font-hoefler'
                  : HeaderTag === 'h2'
                  ? 'text-[34px] font-hoefler'
                  : 'text-[22px]';

              return (
                <HeaderTag
                  key={textField._key}
                  className={`pb-[5px] pt-[10px] text-center ${
                    hero ? 'font-hoefler' : ''
                  } ${fontSizeClass}`}
                  style={{
                    background: hexToRgba(textField.colorTheme?.background),
                    color: textField.colorTheme?.text,
                  }}
                >
                  {textField.heading}
                </HeaderTag>
              );
            }

            case 'descriptionObject': {
              const descriptionSplit = textField.description?.split('\n') || [
                '',
              ];
              return (
                <div
                  key={textField._key}
                  className="flex flex-col gap-3 pb-[10px] pt-[10px]"
                  style={{
                    background: hexToRgba(textField.colorTheme?.background),
                    color: textField.colorTheme?.text,
                  }}
                >
                  {descriptionSplit.map((part) => (
                    <p className="min-h-[20px] text-sm" key={uuidv4()}>
                      {part}
                    </p>
                  ))}
                </div>
              );
            }

            case 'linkInternal':
              return (
                <Link
                  key={textField._key}
                  to={textField.slug}
                  prefetch="intent"
                  className={`flex max-w-max self-center px-2 py-1 text-xs uppercase tracking-[1.2px] ${
                    !textField.hideUnderline
                      ? 'underline decoration-2 underline-offset-8'
                      : ''
                  }`}
                  style={{
                    background: hexToRgba(textField.buttonStyle?.background),
                    color: textField.buttonStyle?.text,
                  }}
                >
                  <span>{textField.title}</span>
                </Link>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
