import SubNavigationMenuItem from '~/components/global/megaMenu/SubNavigationMenuItemMobile';
import {Link} from '~/components/Link';
import {MegaMenuItem} from '~/lib/sanity';

import DropdownMobileImageGrid from './DropdownMobileImageGrid';

type Props = {
  megaMenuItems: MegaMenuItem[];
  handleClose: () => void;
  open: boolean;
};

export default function MegaMenuLinks({
  megaMenuItems,
  handleClose,
  open,
}: Props) {
  return megaMenuItems?.map((item) => {
    // PEAK Assign the main title as Level 1
    const level1 =
      item._type === 'singleNavigationItem'
        ? item.linkList[0].title
        : item.subNavTitle || 'Unknown';

    if (item._type === 'singleNavigationItem') {
      if (item.linkList[0].hideMobileLink) {
        return null;
      }
      if (item.linkList[0]._type === 'linkExternal') {
        return (
          <li
            className="flex items-center"
            key={item.linkList[0]._key}
            data-level1={level1} // PEAK Add data-level1 for main links
          >
            <a
              className="linkTextNavigation topLevelNavText w-full"
              href={item.linkList[0].url}
              rel="noreferrer"
              target={item.linkList[0].newWindow ? '_blank' : '_self'}
              onClick={handleClose}
            >
              {item.linkList[0].title}
            </a>
          </li>
        );
      }
      if (item.linkList[0]._type === 'linkInternal') {
        if (!item.linkList[0].slug) {
          return null;
        }
        return (
          <li
            className="flex items-center"
            key={item.linkList[0]._key}
            data-level1={level1} // PEAK Add data-level1 for main links
          >
            <Link
              className="linkTextNavigation topLevelNavText w-full py-4 pl-2"
              to={item.linkList[0].slug}
              prefetch="none"
              onClick={handleClose}
            >
              {item.linkList[0].title}
            </Link>
          </li>
        );
      }
    }
    if (item._type === 'subNavigationMenu') {
      return (
        <SubNavigationMenuItem
          isDrawerOpen={open}
          subNavItem={item}
          key={item._key}
          handleClose={handleClose}
          parentLevel1={level1} // PEAK Pass Level 1 to sub-navigation items
        />
      );
    }
    if (item._type == 'dropdownMobileImageGrid') {
      return (
        <DropdownMobileImageGrid
          key={item._key}
          title={item.title}
          rowContent={item.rowContent}
          isDrawerOpen={open}
          handleClose={handleClose}
        />
      );
    }
  });
}
