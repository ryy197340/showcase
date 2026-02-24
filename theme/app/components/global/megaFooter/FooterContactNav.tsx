import {memo} from 'react';

import EmailIcon from '~/components/icons/Email';
import FooterLocationPin from '~/components/icons/FooterLocationPin';
import PhoneIcon from '~/components/icons/Phone';
import {Link} from '~/components/Link';
import {SanityLink} from '~/lib/sanity';

type Props = {
  footerContactNav?: {
    callUsNumber?: string;
    emailUsAddress?: string;
    link?: SanityLink;
  };
};

function FooterContactNav({footerContactNav}: Props) {
  const {callUsNumber, emailUsAddress, link} = footerContactNav || {};
  const linkClasses =
    'flex flex-row items-center font-medium uppercase w-[140px]';
  const spanClasses = 'text-[12px] uppercase leading-normal font-bold';
  const callUs = () => {
    if (callUsNumber) {
      return (
        <a href={`tel:${callUsNumber}`} className={linkClasses}>
          <PhoneIcon />
          <span className={spanClasses}>Call us</span>
        </a>
      );
    } else {
      return null;
    }
  };
  const emailUs = () => {
    if (emailUsAddress) {
      return (
        <a href={`mailto:${emailUsAddress}`} className={linkClasses}>
          <EmailIcon />
          <span className={spanClasses}>Email us</span>
        </a>
      );
    }
  };
  const visitUs = () => {
    if (link?._type === 'linkExternal') {
      return (
        <a
          className={linkClasses}
          href={link.url}
          rel="noreferrer"
          target={link.newWindow ? '_blank' : '_self'}
          key={link._key}
        >
          <FooterLocationPin />
          {link.title}
        </a>
      );
    } else if (link?._type === 'linkInternal' && link.slug) {
      return (
        <Link
          className={linkClasses}
          to={link.slug}
          prefetch="intent"
          key={link._key}
        >
          <FooterLocationPin />
          <span className={spanClasses}>{link.title}</span>
        </Link>
      );
    }
    return null;
  };
  return (
    <div className="flex flex-row justify-center border-b border-b-lightGray py-5">
      {callUs()}
      {emailUs()}
      {visitUs()}
    </div>
  );
}

export default memo(FooterContactNav);
