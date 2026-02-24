import clsx from 'clsx';

import {Link} from '~/components/Link';
import {SubNavColumn} from '~/lib/sanity';

import MegaMenuLink from './MegaMenuLink';

type Props = {
  subNavColumns: SubNavColumn[];
  dropdown: boolean;
  navHeight: number;
  imageLoading: string;
  closeDropdown: () => void;
};

const titleClassNames = 'font-hoefler font-regular text-[14px] leading-[130%]';
const columnGap = 20;

type RenderLinkedImageParams = {
  slug: string;
  title: string;
  type: string;
  hideTitle?: boolean;
  textOverlay?: boolean;
};

const renderLinkedImage = ({
  slug,
  title,
  type,
  hideTitle,
  textOverlay,
}: RenderLinkedImageParams) => {
  const imageElement = renderSanityImage({
    title,
    hideTitle,
    textOverlay,
  });
  const shouldWrapWithLink =
    (type === '2xfeaturedImage' ||
      type === 'featuredImage' ||
      type == 'actionGrid') &&
    slug;

  return shouldWrapWithLink ? (
    <Link prefetch="none" to={slug} className="flex flex-col gap-[2px]">
      {imageElement}
    </Link>
  ) : (
    <>{imageElement}</>
  );
};

type RenderSanityImageParams = {
  title?: string;
  hideTitle?: boolean;
  textOverlay?: boolean;
};

const renderSanityImage = ({
  title,
  hideTitle,
  textOverlay,
}: RenderSanityImageParams) => {
  return (
    <>
      {/*SSR note: removing sanity images */}
      {title && !hideTitle && !textOverlay && (
        <span className={`${titleClassNames} text-center`}>{title}</span>
      )}
    </>
  );
};

export function getColumnUnits(column: SubNavColumn) {
  switch (column._type) {
    case 'column':
    case 'singleColumnTwoLinkLists':
      return 2; // text column

    case '2xfeaturedImage':
    case 'FeaturedImageGrid':
      return 6; // wide image

    case 'featuredImage':
    case 'actionGrid':
      return 3; // standard image

    default:
      return 3;
  }
}

export default function DropdownSSR({subNavColumns}: Props) {
  // SSR note: no need of memo use here, memo is only useful for CSR

  const totalGridUnits = subNavColumns
    .filter((column) => column._type !== 'dropdownMobileImageGrid')
    .reduce((total, column) => total + getColumnUnits(column), 0);

  return (
    <div
      className={`absolute left-0 top-full -z-10 hidden h-fit w-full bg-white px-[7%] py-[28px]`}
    >
      <div
        className={`mx-auto grid ${
          totalGridUnits > 4 ? 'max-w-[1020px]' : 'max-w-[820px]'
        }`}
        style={{
          gridTemplateColumns: `repeat(${totalGridUnits}, 1fr)`,
          gap: `${columnGap}px`,
        }}
      >
        {subNavColumns.map((column, index) => {
          const type = column._type;
          // For subnav columns
          if (type === 'column' || type === 'singleColumnTwoLinkLists') {
            const cols =
              type === 'column'
                ? [column]
                : type === 'singleColumnTwoLinkLists'
                ? [column.linkLists[0], column.linkLists[1]]
                : [];
            return (
              <div
                key={column._key}
                className={clsx(
                  'flex flex-col',
                  index > 0 &&
                    'ml-[-20px] border-l border-l-lightGray pl-[20px]',
                  type === 'singleColumnTwoLinkLists' && 'gap-10',
                )}
                style={{gridColumn: `span ${getColumnUnits(column)}`}}
              >
                {cols.map((col) => {
                  return (
                    <div key={col._key}>
                      {col.title ? (
                        <span className="topLevelNavText font-bold">
                          {col.title}
                        </span>
                      ) : null}
                      {col.linkList ? (
                        <ul>
                          {col.linkList.map((link) => (
                            <li key={link._key}>
                              {/* SSR friendly note: passing null function */}
                              <MegaMenuLink
                                link={link}
                                closeDropdown={() => null}
                              />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          }
          // For featured images
          if (type === 'featuredImage' || type === '2xfeaturedImage') {
            return (
              <div
                key={column._key}
                className="relative flex flex-col"
                style={{gridColumn: `span ${getColumnUnits(column)}`}}
              >
                {renderLinkedImage({
                  slug: column.link?.slug ? column.link.slug : '',
                  title: column.title ? column.title : '',
                  type,
                })}
              </div>
            );
          }
          // For action grid -- two columns of images
          if (type === 'actionGrid') {
            return (
              <div
                key={column._key}
                className="col-span-2 grid grid-cols-12 grid-rows-3 gap-3"
              >
                {/* featured image */}
                <div className="col-span-7 row-span-3 flex flex-col justify-center">
                  <div className="row-span-3">
                    {renderLinkedImage({
                      slug: column.actionGridFeaturedImageLink.slug!,
                      title: '',
                      type,
                    })}
                  </div>
                </div>

                {/* column of three images */}
                <div className="col-span-5 row-span-3 flex flex-col justify-center gap-[10px]">
                  {column.imageColumn?.map((col) => {
                    return (
                      <div
                        key={col._key}
                        className="row-span-1 grid grid-cols-2 items-center justify-start gap-[10px]"
                      >
                        {renderLinkedImage({
                          slug: col.actionGridColumnImageLink.slug!,
                          title: col.actionGridColumnImageLink.title,
                          type,
                        })}
                      </div>
                    );
                  })}
                </div>
                {column.actionGridFeaturedImageLink.title &&
                column.actionGridFeaturedImageLink.slug ? (
                  <Link
                    to={column.actionGridFeaturedImageLink.slug}
                    className={`col-span-7 text-center lg:mt-[-7px]`}
                  >
                    <span
                      className={`col-span-7 text-center ${titleClassNames}`}
                    >
                      {column.actionGridFeaturedImageLink.title}
                    </span>
                  </Link>
                ) : (
                  <span className={`col-span-7 text-center ${titleClassNames}`}>
                    {column.actionGridFeaturedImageLink.title}
                  </span>
                )}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
