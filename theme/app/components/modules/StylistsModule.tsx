import {Image} from '@shopify/hydrogen';
import {v4 as uuidv4} from 'uuid';

import {Link} from '~/components/Link';
import type {
  ColumnsOfStylistsModule as ColumnsOfStylistsModuleType,
  ColumnWImage,
} from '~/lib/sanity';

type Props = {
  module?: ColumnsOfStylistsModuleType;
};

export default function ColumnsOfStylistsModule({module}: Props) {
  if (!module) {
    return null; // Return null or handle the case when content is not available.
  }

  const hasSanityLink = (column: ColumnWImage): string | null => {
    const textFields = column.textContent?.textFields;

    if (textFields) {
      for (const field of textFields) {
        if (field._type === 'linkInternal') {
          return field.slug ? field.slug : null;
        }
      }
    }
    return null;
  };

  return (
    <div className="page-width grid grid-cols-2 justify-center gap-x-[6px] gap-y-10 px-5 md:grid-cols-3 lg:px-[156px]">
      {module.columns.map((column) => {
        const moduleBody = (
          <div key={column._key} className="h-full w-full">
            <div
              className="flex h-full w-full flex-col items-center justify-between text-center md:justify-start md:px-0"
              style={{
                backgroundColor: column.textContent?.colorTheme?.background,
                color: column.textContent?.colorTheme?.text,
              }}
            >
              {/* Stylist Image */}
              <Image
                src={column.imageContent.image?.url}
                alt={column.imageContent.altText}
                width={column.imageContent.image?.width}
                height={column.imageContent.image?.height}
                sizes="100%"
                className="hidden object-cover object-center md:block md:min-h-[500px]"
                loading={
                  column.imageContent.imageLoading === 'Lazy' ? 'lazy' : 'eager'
                }
              />
              {column.imageContent.imageMobile && (
                <Image
                  src={column.imageContent.image?.url}
                  alt={column.imageContent.altText}
                  width={column.imageContent.image?.width}
                  height={column.imageContent.image?.height}
                  sizes="100%"
                  className="block object-cover object-center md:hidden md:min-h-[500px]"
                  loading={
                    column.imageContent.imageLoading === 'Lazy'
                      ? 'lazy'
                      : 'eager'
                  }
                />
              )}
              {column.textContent && (
                <div className="flex flex-col gap-[10px] pb-[30px] pt-[30px]">
                  {column.textContent?.textFields?.map((textField) => {
                    switch (textField._type) {
                      case 'headingObject':
                        return (
                          <HeadingComponent
                            key={textField._key}
                            heading={textField.name}
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
                          <span
                            className="button-link-border-b m-auto mt-[17px] block w-fit border-primary px-2 pb-1 text-xs uppercase"
                            key={textField._key}
                          >
                            {textField.title}
                          </span>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              )}
            </div>
          </div>
        );
        const modul = hasSanityLink(column);
        if (modul) {
          return (
            <Link key={column._key} to={modul} prefetch="intent">
              {moduleBody}
            </Link>
          );
        }
        return moduleBody;
      })}
    </div>
  );
}

type HeadingComponentProps = {
  heading: string;
};

function HeadingComponent({heading}: HeadingComponentProps) {
  return (
    <h3 className="font-hoefler text-[24px] leading-[30px] md:px-2">
      {heading}
    </h3>
  );
}

type DescriptionComponentProps = {
  description: string;
};

function DescriptionComponent({description}: DescriptionComponentProps) {
  const descriptionSplit = description ? description.split('\n') : [''];
  return (
    <div>
      {descriptionSplit.map((part) => (
        <p className="text-sm leading-[20px]" key={uuidv4()}>
          {part}
        </p>
      ))}
    </div>
  );
}
