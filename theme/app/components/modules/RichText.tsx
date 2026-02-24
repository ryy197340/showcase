import clsx from 'clsx';
import {v4 as uuidv4} from 'uuid';

import {iRichTextModule} from '~/lib/sanity';

import PortableText from '../portableText/PortableText';
type Props = {
  module?: iRichTextModule;
};

export default function RichTextModule({module}: Props) {
  if (!module) {
    return null;
  }

  let columnWidth = 'full';
  if (module.columnWidth) {
    switch (module.columnWidth) {
      case '100':
        break;
      case '75':
        columnWidth = '3/4';
        break;
      case '66':
        columnWidth = '2/3';
        break;
      case '50':
        columnWidth = '1/2';
        break;
      case '33':
        columnWidth = '1/3';
        break;
      case '25':
        columnWidth = '1/4';
        break;
      default:
        columnWidth = 'full';
    }
  }
  return (
    <div
      className={`page-width row-col-gap-[30px] flex w-${columnWidth} flex-col justify-center gap-6`}
      key={uuidv4()}
    >
      {/* Body */}
      {module.richTextBody &&
        module.richTextBody !== null &&
        module.richTextBody[0].children[0].text !== '' && (
          <PortableText
            blocks={module.richTextBody}
            centered
            className={clsx(
              'body-content mx-auto w-full px-4 pb-24 pt-0', //
              'md:px-8',
            )}
          />
        )}
    </div>
  );
}
