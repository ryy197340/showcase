import {ReactNode} from 'react';

import DecorativeBreadcrumbs from '../heroes/DecorativeBreadcrumbs';

type Props = {
  children?: ReactNode;
  title: string;
  hideBreadcrumbs?: boolean;
};

export default function FormCardWrapper({
  children,
  title,
  hideBreadcrumbs,
}: Props) {
  return (
    <div className="w-full max-w-md">
      {!hideBreadcrumbs && <DecorativeBreadcrumbs title={title} />}

      <h1 className="relative mb-[10px] mt-[10px] text-center font-hoefler text-[34px] before:w-full after:block after:h-[2px] after:bg-[#d3d3d3] after:content-['']">
        {title}
      </h1>
      {children}
    </div>
  );
}
