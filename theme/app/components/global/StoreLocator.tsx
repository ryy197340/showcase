import {Link} from '~/components/Link';
import {SanityLink} from '~/lib/sanity';

import LocationPin from '../icons/LocationPin';
import LocalizedA from './LocalizedA';

type Props = {
  storesLink: SanityLink;
};

export default function StoreLocator({storesLink}: Props) {
  const classes =
    'hidden flex-row items-center gap-[10px] text-2xs font-medium uppercase lg:flex';
  const title = (link: SanityLink) => (link.title ? link.title : 'STORES');
  if (storesLink?._type === 'linkInternal') {
    if (!storesLink.slug) return null;
    return (
      <Link to={storesLink.slug} key={storesLink._key} className={classes}>
        <LocationPin />
        <span className="pt-[3px]">{title(storesLink)}</span>
      </Link>
    );
  } else if (storesLink?._type === 'linkExternal') {
    return (
      <LocalizedA
        className={classes}
        href={storesLink.url}
        rel="noreferrer"
        target={storesLink.newWindow ? '_blank' : '_self'}
        key={storesLink._key}
      >
        <LocationPin />
        <span className="pt-[3px]">{title(storesLink)}</span>
      </LocalizedA>
    );
  }
}
