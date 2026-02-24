import FacebookIcon from '~/components/icons/Facebook';
import InstagramIcon from '~/components/icons/Instagram';
import PinterestIcon from '~/components/icons/Pinterest';
import XIcon from '~/components/icons/X';
import YoutubeIcon from '~/components/icons/Youtube';
import {SocialLinks as SocialLinksType} from '~/lib/sanity';

type Props = {
  socialLinks: SocialLinksType;
  classes: string;
};

export default function SocialLinks({socialLinks, classes}: Props) {
  return (
    <div className="flex flex-col">
      <span className={classes}>Social Links</span>
      <ul className="flex flex-row gap-[14px]">
        {socialLinks.instagramUrl && (
          <li>
            <a href={socialLinks.instagramUrl} rel="noreferrer" target="_blank">
              <InstagramIcon />
            </a>
          </li>
        )}
        {socialLinks.facebookUrl && (
          <li>
            <a href={socialLinks.facebookUrl} rel="noreferrer" target="_blank">
              <FacebookIcon />
            </a>
          </li>
        )}
        {socialLinks.twitterUrl && (
          <li>
            <a href={socialLinks.twitterUrl} rel="noreferrer" target="_blank">
              <XIcon />
            </a>
          </li>
        )}
        {socialLinks.pinterestUrl && (
          <li>
            <a href={socialLinks.pinterestUrl} rel="noreferrer" target="_blank">
              <PinterestIcon />
            </a>
          </li>
        )}
        {socialLinks.youtubeUrl && (
          <li>
            <a href={socialLinks.youtubeUrl} rel="noreferrer" target="_blank">
              <YoutubeIcon />
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}
