import HTMLReactParser from 'html-react-parser';

import type {OneTrustGDPRDoNotSell} from '~/lib/sanity';

type Props = {
  content: OneTrustGDPRDoNotSell;
};

export default function OneTrustGDPRDoNotSell({content}: Props) {
  return (
    <div className={`page-width w-full ${content.cssClass ?? ''}`}>
      {HTMLReactParser(content.embedCode as string)}
    </div>
  );
}
