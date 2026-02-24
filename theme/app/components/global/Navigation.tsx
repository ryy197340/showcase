import clsx from 'clsx';

import type {MegaMenuItem} from '~/lib/sanity';

import MegaMenuLinks from './megaMenu/MegaMenuLinks';

/**
 * A component that defines the navigation for a web storefront
 */

type Props = {
  megaMenu: MegaMenuItem[];
  transparentHeader?: boolean;
  position?: number;
};

export default function Navigation({
  megaMenu,
  transparentHeader,
  position,
}: Props) {
  return (
    <nav
      className={`relative hidden items-stretch justify-center gap-6 bg-inherit text-sm font-bold transition-all
      duration-300 ease-in-out lg:flex
      ${
        !transparentHeader || position !== 0
          ? 'border-b border-lightGray'
          : 'border-b border-transparent'
      }
      ${
        transparentHeader && position === 0
          ? '[text-shadow:3px_3px_3px_rgba(255,255,255,0.9)]'
          : ''
      }`}
    >
      <ul className="flex">
        <MegaMenuLinks megaMenuItems={megaMenu} />
      </ul>
    </nav>
  );
}
