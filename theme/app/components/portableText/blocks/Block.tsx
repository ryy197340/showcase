import {PortableTextBlock} from '@portabletext/types';
import clsx from 'clsx';
import {ReactNode} from 'react';

type Props = {
  children?: ReactNode;
  value: PortableTextBlock;
};

const headingStyles = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

export default function Block({children, value}: Props) {
  if (value.style && headingStyles.includes(value.style)) {
    const HeadingComponent = value.style as
      | 'h1'
      | 'h2'
      | 'h3'
      | 'h4'
      | 'h5'
      | 'h6';
    return (
      <HeadingComponent className={clsx('first:mt-0 last:mb-0')}>
        {children}
      </HeadingComponent>
    );
  } else {
    return (
      <p
        className={clsx(
          'first:mt-0 last:mb-0',
          'relative my-4 leading-paragraph',
        )}
      >
        {children}
      </p>
    );
  }
}
