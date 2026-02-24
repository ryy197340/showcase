import {RemixLinkProps} from '@remix-run/react/dist/components';
import clsx from 'clsx';
import type {ButtonHTMLAttributes, ElementType} from 'react';
import {twMerge} from 'tailwind-merge';

import {Link} from '~/components/Link';

type ButtonMode = 'default' | 'outline';
type ButtonTone = 'critical' | 'default' | 'shopPay' | 'link' | 'light';
type RemixLinkPropsOptional = Omit<RemixLinkProps, 'to'> & {
  to?: RemixLinkProps['to'];
};

type Props = {
  as?: ElementType;
  className?: string;
  mode?: ButtonMode;
  onClick?: () => void;
  to?: string;
  tone?: ButtonTone;
  inlineStyles?: React.CSSProperties;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  RemixLinkPropsOptional;

type ButtonStyleOptions = {
  mode?: ButtonMode;
  tone?: ButtonTone;
  style?: 'default' | 'square' | 'link' | 'light';
};

export const defaultButtonStyles = (options?: ButtonStyleOptions) => {
  const mode: ButtonMode = options?.mode || 'default';
  const tone: ButtonTone = options?.tone || 'default';
  const style: 'default' | 'square' | 'link' | 'light' =
    options?.style || 'default'; // Add this line
  return clsx([
    'flex h-[2.5rem] items-center overflow-hidden p-4 text-sm duration-200 ease-out',
    'disabled:opacity-20 disabled:bg-opacity-100 disabled:cursor-not-allowed',
    mode === 'default' &&
      clsx([
        tone === 'critical' && 'bg-red justify-center',
        tone === 'default' && 'bg-primary justify-center',
        tone === 'light' &&
          'bg-white text-primary border border-solid border-[#13294E]',
        tone === 'shopPay' && 'bg-shopPay justify-center',
        'hover:opacity-80 text-white',
        tone === 'link' && 'justify-start',
        style === 'square' && 'rounded-none h-50 justify-center', // Apply style-specific changes
        style === 'link' && 'text-blue pl-0',
      ]),
    mode === 'outline' &&
      clsx([
        tone === 'critical' && 'border-color-red text-red justify-center',
        tone === 'default' &&
          'border-color-primary text-primary justify-center',
        tone === 'light' &&
          'bg-white text-primary border border-solid border-[#13294E]',
        tone === 'shopPay' &&
          'border-color-shopPay text-shopPay justify-center',
        'bg-transparent border hover:opacity-50',
        style === 'square' && 'rounded-none w-full h-50 justify-center', // Apply style-specific changes
      ]),
  ]);
};

export const squareButtonStyles = (options?: ButtonStyleOptions) => {
  return clsx([
    'flex h-12 items-center justify-center overflow-hidden rounded-none text-xs uppercase duration-200 ease-out', // Set height to 50px
    'disabled:opacity-20 disabled:bg-opacity-100 disabled:cursor-not-allowed',
    options?.mode === 'default' &&
      clsx([
        options?.tone === 'critical' && 'bg-red',
        options?.tone === 'default' && 'bg-primary',
        options?.tone === 'light' &&
          'bg-white text-primary border border-solid border-[#13294E]',
        options?.tone === 'shopPay' && 'bg-shopPay py-4',
        'hover:opacity-80 text-white',
        options?.style === 'square' && 'rounded-none',
        options?.style === 'link' && 'text-blue',
      ]),
    options?.mode === 'outline' &&
      clsx([
        options?.tone === 'critical' && 'border-color-red text-red',
        options?.tone === 'default' && 'border-color-primary text-primary',
        options?.tone === 'light' &&
          'bg-white text-primary border border-solid border-[#13294E]',
        options?.tone === 'shopPay' && 'border-color-shopPay text-shopPay',
        'bg-transparent border hover:opacity-50',
        options?.style === 'square' && 'rounded-none',
      ]),
  ]);
};

export default function Button({
  as = 'button',
  className,
  mode = 'default',
  tone,
  style,
  inlineStyles,
  ...props
}: Props) {
  const Component = props?.to ? Link : as;

  return (
    <Component
      className={twMerge(defaultButtonStyles({mode, tone}), className)}
      style={inlineStyles}
      {...props}
    />
  );
}

export const blueButtonStyles =
  'min-h-[50px] w-full bg-primary px-5 py-[10px] text-[12px] uppercase tracking-[1.2px] text-white';
