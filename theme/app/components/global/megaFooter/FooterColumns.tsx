import {Link} from '~/components/Link';
import {
  FooterSection,
  SanityLink,
  SocialLinks as SocialLinksType,
} from '~/lib/sanity';

import LocalizedA from '../LocalizedA';
import SocialLinks from './SocialLinks';

type Props = {
  megaFooter: FooterSection[];
  socialLinks: SocialLinksType;
};

export default function FooterColumns({megaFooter, socialLinks}: Props) {
  const columnClasses = 'flex flex-col md:w-1/5';
  const headerClasses =
    'uppercase pb-[10px] text-[12px] flex flex-col cursor-default tracking-[1.2px]';
  const footerListLink = `text-[12px] leading-[30px]`;

  const returnLink = (link: SanityLink, classes: string) => {
    if (link._type == 'linkExternal') {
      return (
        <LocalizedA
          href={link.url}
          rel="noreferrer"
          target={link.newWindow ? '_blank' : '_self'}
          className={classes}
        >
          {link.title}
        </LocalizedA>
      );
    } else if (link._type == 'linkInternal' && link.slug) {
      return (
        <Link to={link.slug} prefetch="intent" className={classes}>
          {link.title}
        </Link>
      );
    }
  };
  const safeFooterItems = Array.isArray(megaFooter) ? megaFooter : [];

  return (
    <>
      {safeFooterItems.map((footerItem, index) => {
        if (footerItem._type === 'footerSection') {
          return (
            <div
              className={`${columnClasses} ${
                footerItem.footerSectionLinklist.length > 4
                  ? 'row-span-2'
                  : 'row-span-1'
              }`}
              key={footerItem._key}
            >
              <div className="pb-[30px]">
                <span className={headerClasses}>
                  {footerItem.footerSectionTitle}
                </span>
                <ul>
                  {footerItem.footerSectionLinklist?.map((link) => (
                    <li key={link._key}>{returnLink(link, footerListLink)}</li>
                  ))}
                </ul>
              </div>
              {index == megaFooter.length - 1 && (
                <SocialLinks
                  socialLinks={socialLinks}
                  classes={headerClasses}
                />
              )}
            </div>
          );
        }
        return null;
      })}
    </>
  );
}
