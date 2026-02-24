import {PortableText} from '@portabletext/react';

type Props = any;

export default function RichTextModuleNew({module}: Props) {
  return <PortableText blocks={module.richTextBody} />;
}
