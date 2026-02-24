import {Link} from '~/components/Link';
import {MegaMenuItem} from '~/lib/sanity';

import SubNavigationMenuItem from './SubNavigationMenuItem';

type Props = {
  megaMenuItems: MegaMenuItem[];
};

const liClassNames = 'flex items-center px-[15px] level1-item'; //PEAK Added LEVEL1 to the main category items
const hoverClassNames =
  'relative after:absolute after:bottom-0 after:left-1/2 after:translate-x-[-50%] after:h-[2px] after:bg-primary after:transition-all after:duration-300 after:ease-in-out after:w-0 hover:after:w-full hover:after:z-10';

const buttonClassNames = `-mx-[15px] flex min-h-[50px] items-center bg-primary bg-opacity-0 px-[15px] duration-75 topLevelNavText ${hoverClassNames}`;
export default function MegaMenuLinks({megaMenuItems}: Props) {
  return megaMenuItems?.map((item) => {
    // PEAK Assign the main title as Level 1
    const level1 =
      item._type === 'singleNavigationItem'
        ? item.linkList[0].title
        : item.subNavTitle || 'Unknown';

    if (item._type === 'singleNavigationItem') {
      if (item.linkList[0]._type === 'linkExternal') {
        return (
          <li
            className={liClassNames}
            key={item.linkList[0]._key}
            data-level1={level1} // PEAK Add data-level1 only for main links
          >
            <Link
              to={item.linkList[0].url}
              className={buttonClassNames}
              rel="noreferrer"
              target={item.linkList[0].newWindow ? '_blank' : '_self'}
              prefetch="none"
            >
              {item.linkList[0].title}
            </Link>
          </li>
        );
      }
      if (item.linkList[0]._type === 'linkInternal') {
        if (!item.linkList[0].slug) {
          return null;
        }
        return (
          <li
            className={liClassNames}
            key={item.linkList[0]._key}
            data-level1={level1} // PEAK Add data-level1 only for main links
          >
            <Link
              className={buttonClassNames}
              to={item.linkList[0].slug}
              prefetch="none"
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
          subNavItem={item}
          key={item._key}
          liClassNames={liClassNames}
          hoverClassNames={hoverClassNames}
          buttonClassNames={buttonClassNames}
          parentLevel1={level1} // PEAK Pass Level 1 to sub-navigation items
        />
      );
    }
  });
}
