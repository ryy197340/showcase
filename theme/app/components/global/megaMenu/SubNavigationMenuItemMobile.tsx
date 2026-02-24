import {stegaClean} from '@sanity/client/stega';
import clsx from 'clsx';
import {useEffect, useRef, useState} from 'react';

import {ChevronDownIcon} from '~/components/icons/ChevronDown';
import {SubNavigationMenu} from '~/lib/sanity';

import DropdownMobile from './DropdownMobile';

type Props = {
  isDrawerOpen: boolean;
  subNavItem: SubNavigationMenu;
  handleClose: () => void;
  parentLevel1: string; // PEAK Pass Level 1 from parent
};
export default function SubNavigationMenuItem({
  isDrawerOpen,
  subNavItem,
  handleClose,
  parentLevel1,
}: Props) {
  const [dropdown, setDropdown] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const ref = useRef<any>();

  const handleClick = () => {
    setNavHeight(ref.current.clientHeight);
    setDropdown((prev) => !prev);
  };

  const closeDropdown = () => {
    setDropdown(false);
    handleClose();
  };

  if (subNavItem.navTitleLink?.hideMobileLink) {
    return null;
  }

  return (
    <li
      className="level1-item relative flex flex-col" // PEAK Add level1-item class
      ref={ref}
      key={subNavItem._key}
      data-level1={parentLevel1} // PEAK Add data-level1 for sub-navigation items
    >
      {/* Title */}
      <div className="flex flex-row items-center">
        <button
          className={clsx(
            'flex w-full items-center rounded-sm py-4 pl-2 pr-3 duration-150',
            `topLevelNavText${
              stegaClean(subNavItem.subNavTitle).toLowerCase() == 'sale'
                ? ' text-sale'
                : ''
            }`,
          )}
          style={{
            ...(subNavItem.navTitleLink?.buttonStyle && {
              backgroundColor: stegaClean(
                subNavItem.navTitleLink.buttonStyle.background,
              ),
              color: stegaClean(subNavItem.navTitleLink.buttonStyle.text),
            }),
          }}
          type="button"
          aria-haspopup="menu"
          onClick={handleClick}
        >
          {subNavItem.subNavTitle}
        </button>
        <ChevronDownIcon
          className={clsx(
            'ml-2 transition-transform duration-200 ease-in-out',
            dropdown && 'rotate-180',
          )}
          onClick={handleClick}
        />
      </div>
      <DropdownMobile
        subNavColumns={subNavItem.subNavColumns}
        dropdown={dropdown}
        isDrawerOpen={isDrawerOpen}
        navHeight={navHeight}
        closeDropdown={closeDropdown}
        handleClose={handleClose}
      />
    </li>
  );
}
