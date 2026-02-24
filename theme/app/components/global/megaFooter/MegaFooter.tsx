import {FooterSection, SocialLinks as SocialLinksType} from '~/lib/sanity';

import FooterColumns from './FooterColumns';

type Props = {
  megaFooter: FooterSection[];
  socialLinks: SocialLinksType;
};

export default function MegaFooter({megaFooter, socialLinks}: Props) {
  return (
    <div className="page-width grid grid-cols-2 px-5 pt-8 md:flex md:flex-row md:items-start md:justify-center md:px-10">
      <FooterColumns megaFooter={megaFooter} socialLinks={socialLinks} />
    </div>
  );
}
