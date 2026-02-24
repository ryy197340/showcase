import {Link} from '~/components/Link';
import {SanityLink} from '~/lib/sanity';
type Props = {link: SanityLink; closeDropdown: () => void};

export default function MegaMenuLink({link, closeDropdown}: Props) {
  if (link._type === 'linkInternal') {
    if (!link.slug) return null;
    return (
      <Link
        className="relative font-regular leading-[100%] decoration-[0.1em] underline-offset-[0.1em] after:absolute after:bottom-[-2px] after:left-1/2 after:h-[1px] after:w-0 after:translate-x-[-50%] after:bg-primary after:transition-all after:duration-100 after:ease-in-out hover:after:z-10 hover:after:w-full md:text-[14px]"
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
        className="relative font-regular leading-[100%] decoration-[0.1em] underline-offset-[0.1em] after:absolute after:bottom-[-2px] after:left-1/2 after:h-[1px] after:w-0 after:translate-x-[-50%] after:bg-primary after:transition-all after:duration-100 after:ease-in-out hover:after:z-10 hover:after:w-full md:text-[14px]"
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
