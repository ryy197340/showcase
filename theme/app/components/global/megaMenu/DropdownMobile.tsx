import {
  DropdownMobileImageGrid as DropdownMobileImageGridType,
  SanityLink,
  SubNavColumn,
  SubNavMenuColumn,
  TwoRowLinkList,
} from '~/lib/sanity';

import DropdownMobileImageGrid from './DropdownMobileImageGrid';
import MegaMenuLinkMobile from './MegaMenuLinkMobile';

type MobileSubNavColumnProps = {
  column: SubNavMenuColumn | TwoRowLinkList | DropdownMobileImageGridType;
  isDrawerOpen: boolean;
  closeDropdown: () => void;
  handleClose: () => void;
};
const MobileSubNavColumn = ({
  column,
  isDrawerOpen,
  closeDropdown,
  handleClose,
}: MobileSubNavColumnProps) => {
  if (column._type === 'dropdownMobileImageGrid') {
    return (
      <DropdownMobileImageGrid
        key={column._key}
        title={column.title}
        rowContent={column.rowContent ?? []}
        isDrawerOpen={isDrawerOpen}
        handleClose={handleClose}
      />
    );
  }

  return (
    <div key={column._key} className="flex shrink-0 flex-col px-[30px]">
      {'title' in column && column.title && (
        <span className="topLevelNavText py-4 font-bold">{column.title}</span>
      )}
      {'linkList' in column && column.linkList && (
        <ul className="pl-2">
          {column.linkList.map((link: SanityLink) => (
            <li key={link._key} className="w-full text-[12px]">
              <MegaMenuLinkMobile
                link={link}
                closeDropdown={closeDropdown}
                handleClose={handleClose}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

type DropdownMobileProps = {
  subNavColumns: SubNavColumn[];
  isDrawerOpen: boolean;
  dropdown: boolean;
  navHeight: number;
  closeDropdown: () => void;
  handleClose: () => void;
};

export default function DropdownMobile({
  subNavColumns,
  isDrawerOpen,
  dropdown,
  navHeight,
  closeDropdown,
  handleClose,
}: DropdownMobileProps) {
  return (
    <div
      className={`-left-1.5 bottom-0 z-10 h-fit w-full bg-white py-[18px] ${
        dropdown ? 'block' : 'hidden'
      }`}
      style={{top: navHeight ? navHeight : 0}}
    >
      <div className={`mx-auto mb-[10px] flex flex-col`}>
        {subNavColumns.map((column) => {
          // For subnav columns
          if (
            column._type === 'column' ||
            (column._type === 'dropdownMobileImageGrid' &&
              !column.hideMobileLink)
          ) {
            return (
              <MobileSubNavColumn
                key={column._key}
                column={column}
                isDrawerOpen={isDrawerOpen}
                closeDropdown={closeDropdown}
                handleClose={handleClose}
              />
            );
          }
          // For subnav columns
          if (
            column._type === 'singleColumnTwoLinkLists' &&
            !column.hideMobileLink
          ) {
            return column.linkLists.map((linkList) => {
              if (!linkList.hideMobileLink) {
                return (
                  <MobileSubNavColumn
                    key={linkList._key}
                    column={linkList}
                    isDrawerOpen={isDrawerOpen}
                    closeDropdown={closeDropdown}
                    handleClose={handleClose}
                  />
                );
              }
            });
          }
        })}
      </div>
    </div>
  );
}
