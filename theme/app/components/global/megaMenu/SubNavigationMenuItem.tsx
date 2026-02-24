import {stegaClean} from '@sanity/client/stega';
import clsx from 'clsx';
import {useCallback, useEffect, useRef, useState} from 'react';

import {Link} from '~/components/Link';
import {useHydration} from '~/hooks/useHydration';
import {SubNavigationMenu} from '~/lib/sanity';

import Dropdown from './Dropdown';
import SubNavigationMenuItemSSR from './SubNavigationMenuItemSSR';

type Props = {
  subNavItem: SubNavigationMenu;
  liClassNames: string;
  hoverClassNames?: string;
  buttonClassNames: string;
  parentLevel1: string; // PEAK Pass the Level 1 (main category) down
};

function SubNavigationMenuItemCSR({
  subNavItem,
  liClassNames,
  hoverClassNames,
  buttonClassNames,
  parentLevel1,
}: Props) {
  const [dropdown, setDropdown] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const imageLoading = 'lazy';
  const ref = useRef<any>();
  const handleClick = useCallback(() => {
    setNavHeight(ref.current.clientHeight);
    setDropdown((prev) => !prev);
  }, []);
  const closeDropdown = useCallback(() => {
    dropdown && setDropdown(false);
  }, [dropdown]);
  const onMouseEnter = useCallback(() => {
    setNavHeight(ref.current.clientHeight);
    setDropdown(true);
  }, []);
  const onMouseLeave = useCallback(() => {
    setDropdown(false);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      if (dropdown && ref.current && !ref.current.contains(event.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      // Cleanup the event listener
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [dropdown]);

  return (
    <li
      className={`${liClassNames} max-h-[50px] flex-col overflow-y-visible after:relative after:min-h-[15px] after:w-[100%] after:content-['']`}
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-level1={stegaClean(parentLevel1)} // Add Level 1 data to sub-menu container
    >
      {subNavItem.navTitleLink?.slug && (
        <Link
          to={subNavItem.navTitleLink.slug}
          prefetch="none"
          className={clsx(
            buttonClassNames,
            stegaClean(subNavItem.subNavTitle).toLowerCase() == 'sale'
              ? ' text-sale'
              : '',
          )}
          style={{
            // buttonStyle from Sanity
            ...(subNavItem.navTitleLink?.buttonStyle && {
              backgroundColor: stegaClean(
                subNavItem.navTitleLink.buttonStyle.background,
              ),
              color: stegaClean(subNavItem.navTitleLink.buttonStyle.text),
            }),
          }}
          data-level1={stegaClean(parentLevel1)}
        >
          {subNavItem.subNavTitle}
        </Link>
      )}
      {!subNavItem.navTitleLink?.slug && (
        <button
          className={clsx(
            buttonClassNames,
            subNavItem.subNavTitle.toLowerCase() == 'sale' ? ' text-sale' : '',
          )}
          type="button"
          aria-haspopup="menu"
          onClick={handleClick}
        >
          {subNavItem.subNavTitle}
        </button>
      )}
      <Dropdown
        subNavColumns={subNavItem.subNavColumns}
        key={subNavItem._key}
        dropdown={dropdown}
        navHeight={navHeight}
        closeDropdown={closeDropdown}
        imageLoading={imageLoading}
        dropdownColorTheme={subNavItem.dropdownColorTheme}
      />
    </li>
  );
}

export default function SubNavigationMenuItem(props: any) {
  const isHydrated = useHydration();
  return (
    <>
      {isHydrated ? (
        <SubNavigationMenuItemCSR {...props} />
      ) : (
        <SubNavigationMenuItemSSR {...props} />
      )}
    </>
  );
}
