import {useMatches} from '@remix-run/react';
import clsx from 'clsx';
import {useMemo} from 'react';

import {Link} from '~/components/Link';
import {SubNavColumn} from '~/lib/sanity';
import {hexToRgba} from '~/utils/styleHelpers';

import DropdownLinkedImage from './DropdownLinkedImage';
import MegaMenuLink from './MegaMenuLink';

type Props = {
  subNavColumns: SubNavColumn[];
  dropdown: boolean;
  navHeight: number;
  imageLoading: string;
  closeDropdown: () => void;
  dropdownColorTheme?: {
    background?: string;
    text?: string;
  };
};

function DropdownCSR({
  subNavColumns,
  dropdown,
  navHeight,
  imageLoading,
  closeDropdown,
  dropdownColorTheme,
}: Props) {
  const [root] = useMatches();
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;

  const isImageColumn = (type: string) =>
    type === 'featuredImage' || type === '2xfeaturedImage';

  const isTextColumn = (type: string) =>
    type === 'column' || type === 'singleColumnTwoLinkLists';

  const textTypes = ['column', 'singleColumnTwoLinkLists'];

  const totalTextTypesCount = subNavColumns.filter((col) =>
    textTypes.includes(col._type),
  ).length;

  // const hasFeaturedImageGrid = useMemo(
  //   () => subNavColumns.some((col) => col._type === 'FeaturedImageGrid'),
  //   [subNavColumns],
  // );

  const isXLScreen =
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : false;
  const maxDropdownHeight = isXLScreen
    ? `calc(80vh - ${navHeight}px)`
    : undefined;

  const getColumnUnits = (column: SubNavColumn) => {
    switch (column._type) {
      case 'column':
      case 'singleColumnTwoLinkLists':
        return 2; // half width
      case '2xfeaturedImage':
      case 'FeaturedImageGrid':
      case 'actionGrid':
        return 6; // double image width
      default:
        return 3; // normal image / default
    }
  };

  const totalGridUnits = useMemo(
    () =>
      subNavColumns
        .filter((column) => column._type !== 'dropdownMobileImageGrid')
        .reduce((total, column) => total + getColumnUnits(column), 0),
    [subNavColumns],
  );

  return (
    <div
      className={clsx(
        'absolute left-0 top-full w-full bg-white transition-opacity duration-300 ease-in-out',
        dropdown
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0',
      )}
      style={{
        top: navHeight ? navHeight : 0,
        backgroundColor: hexToRgba(dropdownColorTheme?.background),
        color: dropdownColorTheme?.text,
        maxHeight: maxDropdownHeight,
        textShadow: 'none',
      }}
    >
      <div
        className={`mx-auto grid h-full pr-5
        md:w-full md:justify-center`}
        style={{
          gridTemplateColumns: `repeat(${totalGridUnits}, 1fr)`,
        }}
      >
        {subNavColumns.map((column, index) => {
          const type = column._type;
          const columnUnits = getColumnUnits(column);
          const textIndex = subNavColumns
            .slice(0, index)
            .filter(
              (col) =>
                col._type === 'column' ||
                col._type === 'singleColumnTwoLinkLists',
            ).length;

          // For subnav text columns
          if (isTextColumn(type)) {
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
                  'flex h-full flex-col py-[28px]',
                  index === 0 && 'pl-5',
                  textIndex === totalTextTypesCount - 1 && 'mr-5 pr-[20px]',

                  type === 'singleColumnTwoLinkLists' && 'gap-10',
                )}
                style={{
                  gridColumn: `span ${columnUnits}`,
                  backgroundColor: hexToRgba(column.buttonStyle?.background),
                  color: column.buttonStyle?.text,
                  maxHeight: maxDropdownHeight,
                }}
              >
                {cols.map((col) => {
                  return (
                    <div key={col._key}>
                      {col.title ? (
                        <span
                          className="topLevelNavText !md:text-[14px] font-bold md:mb-5"
                          style={{
                            backgroundColor: hexToRgba(
                              col.buttonStyle?.background,
                            ),
                            color: col.buttonStyle?.text,
                          }}
                        >
                          {col.title}
                        </span>
                      ) : null}
                      {col.linkList ? (
                        <ul className="mt-2 flex flex-col gap-3">
                          {col.linkList.map((link) => (
                            <li key={link._key}>
                              <MegaMenuLink
                                link={link}
                                closeDropdown={closeDropdown}
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
          // For Videowise Insert
          if (type === 'singleColumnVideowise' && column.html) {
            return (
              <div
                key={column._key}
                className="relative flex flex-col"
                dangerouslySetInnerHTML={{__html: column.html}}
              />
            );
          }

          // For featured images
          if (isImageColumn(type)) {
            const imageIndex = subNavColumns
              .slice(0, index)
              .filter(
                (col) =>
                  col._type === 'featuredImage' ||
                  col._type === '2xfeaturedImage',
              ).length;
            return (
              <div
                key={column._key}
                className={clsx('relative mx-2 flex h-full flex-col py-[28px]')}
                style={{
                  gridColumn: `span ${columnUnits}`,
                  maxHeight: maxDropdownHeight,
                }}
              >
                <DropdownLinkedImage
                  {...{
                    isDropdownOpen: dropdown,
                    image: column.image,
                    altText: column.altText,
                    slug: column.link?.slug ? column.link.slug : '',
                    hideUnderline: column?.link?.hideUnderline,
                    title: column.title ? column.title : '',
                    type,
                    imageLoading,
                    sanityDataset,
                    sanityProjectID,
                    hideTitle: column.hideTitle,
                    textOverlay: column.textOverlay,
                    font: column.font,
                    textAlign: column.textAlign,
                    disableHoverZoom: column.disableHoverZoom,
                    largeText: column.largeText,
                  }}
                />
              </div>
            );
          }
          if (type === 'FeaturedImageGrid') {
            return (
              <div
                key={column._key}
                className={clsx(
                  'py-[28px]',

                  'flex w-full flex-col',
                )}
                style={{
                  gridColumn: `span ${columnUnits}`,
                  maxHeight: maxDropdownHeight,
                }}
              >
                {column.gridTitle && (
                  <span
                    className={`w-full text-${column.gridTitleAlignment} topLevelNavText !md:text-[14px] mb-2 font-bold`}
                  >
                    {column.gridTitle}
                  </span>
                )}

                {/* 4-column grid of images */}
                <div className="grid w-full grid-cols-4 gap-2">
                  {column.rowContent?.map((singleImage) => (
                    <div
                      key={singleImage._key}
                      className="relative flex flex-col"
                    >
                      <DropdownLinkedImage
                        {...{
                          isDropdownOpen: dropdown,
                          image: singleImage.image,
                          altText: singleImage.altText,
                          slug: singleImage.link?.slug
                            ? singleImage.link.slug
                            : '',
                          title: singleImage.title ? singleImage.title : '',
                          type: singleImage._type,
                          imageLoading,
                          sanityDataset,
                          sanityProjectID,
                          hideTitle: singleImage.hideTitle,
                          textOverlay: singleImage?.textOverlay,
                          font: singleImage?.font,
                          textAlign: singleImage?.textAlign,
                          disableHoverZoom: singleImage?.disableHoverZoom,
                          imageAspectRatio: column.imageAspectRatio,
                          largeText: singleImage?.largeText,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          // For action grid -- two columns of images
          if (type === 'actionGrid') {
            return (
              <div
                key={column._key}
                className="grid grid-cols-3 grid-rows-3 gap-3 overflow-hidden py-[28px]"
                style={{
                  gridColumn: `span ${columnUnits}`,
                  height: `calc(60vh - ${navHeight}px)`,
                }}
              >
                {/* featured image */}
                <div className="col-span-2 row-span-3 flex flex-col justify-center">
                  <div
                    className="row-span-3"
                    style={{maxHeight: maxDropdownHeight}}
                  >
                    <DropdownLinkedImage
                      {...{
                        isDropdownOpen: dropdown,
                        image: column.actionGridFeaturedImage,
                        altText: column.altText,
                        slug: column.actionGridFeaturedImageLink.slug!,
                        title: '',
                        type,
                        imageLoading,
                        sanityDataset,
                        sanityProjectID,
                      }}
                    />
                  </div>
                </div>

                {/* column of three images */}
                <div
                  className="col-span-1 row-span-3 flex flex-col justify-center gap-[10px]"
                  style={{maxHeight: `calc(60vh - ${navHeight}px)`}}
                >
                  {column.imageColumn?.map((col) => {
                    return (
                      <div
                        key={col._key}
                        className="row-span-1 grid grid-cols-1 items-center justify-start gap-[10px]"
                      >
                        <DropdownLinkedImage
                          {...{
                            isDropdownOpen: dropdown,
                            image: col.actionGridColumnImage,
                            altText: col.altText,
                            slug: col.actionGridColumnImageLink.slug!,
                            title: col.actionGridColumnImageLink.title,
                            type,
                            imageLoading,
                            sanityDataset,
                            sanityProjectID,
                          }}
                        />
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
                    <span className={`col-span-7 text-center`}>
                      {column.actionGridFeaturedImageLink.title}
                    </span>
                  </Link>
                ) : (
                  <span className={`col-span-7 text-center`}>
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

export default DropdownCSR;
