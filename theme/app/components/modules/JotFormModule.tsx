import JotformEmbed from 'react-jotform-embed';

import type {JotFormModule} from '~/lib/sanity';
import {useColorTheme} from '~/lib/theme';

type Props = {
  module: JotFormModule;
};

export default function JotFormModule({module}: Props) {
  const colorTheme = useColorTheme();

  if (!module) {
    return null; // Return null or handle the case when content is not available.
  }
  return (
    <div className="page-width w-full px-5" key="calloutButton">
      <div
        className="mr-auto flex flex-col items-center"
        style={{color: colorTheme?.text, marginTop: '-40px'}}
      >
        <JotformEmbed src={`${module.iframeUrl}`} className="text-primary" />
      </div>
    </div>
  );
}
