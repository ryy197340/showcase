declare module 'react-jotform-embed' {
  import { ComponentType } from 'react';
  interface JotformEmbedProps {
    src: string;
    className?: string;
    // ...any other props you want to define
  }
  const JotformEmbed: ComponentType<JotformEmbedProps>;
  export default JotformEmbed;
}
