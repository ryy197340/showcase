import {v4 as uuidv4} from 'uuid';

import {Link} from '~/components/Link';
import type {ColumnsOfTextModule, SanityLinkInternal} from '~/lib/sanity';

type Props = {
  content?: ColumnsOfTextModule;
};

export default function ColumnsOfTextModule({content}: Props) {
  const hasTextFieldContent = (content: ColumnsOfTextModule): boolean => {
    return content.columns.some(
      (column) => column.textContent.textFields !== null,
    );
  };

  if (!content || !hasTextFieldContent(content)) {
    return null; // Return null or handle the case when content is not available.
  }
  return (
    <div className="page-width grid gap-x-[6px] gap-y-10 lg:grid-cols-3 lg:gap-y-15 lg:px-[156px]">
      {content.columns.map((column) => (
        <div key={column._key}>
          <div
            className="flex w-full flex-col items-center gap-[17px] px-[27px] py-[17px] text-center lg:px-2"
            style={{
              backgroundColor: column.textContent.colorTheme?.background,
              color: column.textContent.colorTheme?.text,
            }}
          >
            {column.textContent?.textFields?.map((textField) => {
              switch (textField._type) {
                case 'headingObject':
                  return (
                    <HeadingComponent
                      key={textField._key}
                      heading={textField.heading}
                    />
                  );
                case 'subHeadingObject':
                  return (
                    <SubHeadingComponent
                      key={textField._key}
                      heading={textField.subHeading}
                    />
                  );
                case 'descriptionObject':
                  return (
                    <DescriptionComponent
                      key={textField._key}
                      description={textField.description}
                    />
                  );
                case 'linkInternal':
                  return (
                    <LinkComponent key={textField._key} link={textField} />
                  );
                default:
                  return null;
              }
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

type HeadingComponentProps = {
  heading: string;
};

function HeadingComponent({heading}: HeadingComponentProps) {
  return <h3 className="text-[24px] leading-[30px] md:px-2">{heading}</h3>;
}

function SubHeadingComponent({heading}: HeadingComponentProps) {
  return <h4 className="leading-[30px] md:px-2">{heading}</h4>;
}

type DescriptionComponentProps = {
  description: string;
};

function DescriptionComponent({description}: DescriptionComponentProps) {
  const descriptionSplit = description ? description.split('\n') : [''];
  return (
    <div>
      {descriptionSplit.map((part, index) => (
        <p className="text-sm leading-[20px]" key={uuidv4()}>
          {part}
        </p>
      ))}
    </div>
  );
}

type LinkComponentProps = {
  link: SanityLinkInternal;
};

const linkClasses =
  'block w-full button-link-border-b border-primary px-2 pb-1 text-xs uppercase';

function LinkComponent({link}: LinkComponentProps) {
  if (link.slug) {
    return (
      <Link to={link.slug} prefetch="intent">
        <span className={linkClasses}>{link.title}</span>
      </Link>
    );
  } else {
    return <span className={linkClasses}>{link.title}</span>;
  }
}
