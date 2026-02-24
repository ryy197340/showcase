import clsx from 'clsx';

import {Link} from '~/components/Link';
import {SubNavigationMenu} from '~/lib/sanity';

import Dropdown from './Dropdown';

type Props = {
  subNavItem: SubNavigationMenu;
  liClassNames: string;
  hoverClassNames?: string;
  buttonClassNames: string;
  parentLevel1: string; // PEAK Pass the Level 1 (main category) down
};

export default function SubNavigationMenuItem({
  subNavItem,
  liClassNames,
  hoverClassNames,
  buttonClassNames,
  parentLevel1,
}: Props) {
  return (
    <li
      className={liClassNames}
      data-level1={parentLevel1} // Add Level 1 data to sub-menu container
    >
      {subNavItem.navTitleLink?.slug && (
        <Link
          to={subNavItem.navTitleLink.slug}
          prefetch="none"
          className={clsx(
            buttonClassNames,
            subNavItem.subNavTitle.toLowerCase() == 'sale' ? ' text-sale' : '',
          )}
          data-level1={parentLevel1} // Add Level 1 data
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
        >
          {subNavItem.subNavTitle}
        </button>
      )}
      {/* note: passing SSR friendly props to SSR friendly version of Dropdown */}
      <Dropdown
        subNavColumns={subNavItem.subNavColumns}
        key={subNavItem._key}
      />
    </li>
  );
}
