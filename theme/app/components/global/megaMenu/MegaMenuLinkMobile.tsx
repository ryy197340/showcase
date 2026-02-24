import {Link} from '~/components/Link';
import {SanityLink} from '~/lib/sanity';
type Props = {link: SanityLink; closeDropdown: any; handleClose: () => void};

export default function MegaMenuLinkMobile({
  link,
  closeDropdown,
  handleClose,
}: Props) {
  if (link.hideMobileLink) {
    return null;
  }
  if (link._type === 'linkInternal') {
    if (!link.slug) return null;
    return (
      <Link
        className="linkTextNavigation font-regular"
        to={link.slug}
        prefetch="none"
        onClick={closeDropdown}
      >
        {link.title}
      </Link>
    );
  }
  if (link._type === 'linkExternal') {
    return (
      <a
        className="linkTextNavigation font-regular"
        href={link.url}
        rel="noreferrer"
        target={link.newWindow ? '_blank' : '_self'}
        onClick={closeDropdown}
      >
        {link.title}
      </a>
    );
  }
}
