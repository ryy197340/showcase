import JotformEmbed from 'react-jotform-embed';

import type {LetsGetStyled} from '~/lib/sanity';
import {useColorTheme} from '~/lib/theme';

type Props = {
  module: LetsGetStyled;
};

export default function LetsGetStyled({module}: Props) {
  const colorTheme = useColorTheme();
  const descriptionText = module?.descriptionText;
  if (!module) {
    return null; // Return null or handle the case when content is not available.
  }
  return (
    <div
      className="page-width w-full px-5 md:px-10 lg:px-[272px]"
      key="calloutButton"
    >
      <div
        className="mr-auto flex flex-col items-center"
        style={{color: colorTheme?.text}}
      >
        <h3 className="pb-[14px] text-xl2">Let’s Get Styled</h3>

        {descriptionText && <p className="text-sm">{descriptionText}</p>}
        <JotformEmbed src={`${module.iframeUrl}`} className="text-primary" />
      </div>
    </div>
  );
}
