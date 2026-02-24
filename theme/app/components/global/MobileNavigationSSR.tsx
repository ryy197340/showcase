import MegaMenuLinks from '~/components/global/megaMenu/MegaMenuLinksMobile';
import type {MegaMenuItem, SanityMenuLink} from '~/lib/sanity';

type Props = {
  megaMenu: MegaMenuItem[];
};

export default function MobileNavigation({megaMenu}: Props) {
  return (
    <>
      {/* SSR note: only rendering relevant links, passing null function to fulfill onclick */}
      <MegaMenuLinks
        megaMenuItems={megaMenu}
        handleClose={() => null}
        open={false}
      />
    </>
  );
}
