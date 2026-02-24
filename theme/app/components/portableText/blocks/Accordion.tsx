import {Disclosure} from '@headlessui/react';
import {PortableTextBlock} from '@portabletext/types';
import clsx from 'clsx';

import MinusIcon from '~/components/icons/Minus';
import PlusIcon from '~/components/icons/Plus';
import PortableText from '~/components/portableText/PortableText';
import type {SanityModuleAccordion} from '~/lib/sanity';

type Props = {
  value: PortableTextBlock & SanityModuleAccordion;
};

export default function AccordionBlock({value}: Props) {
  return (
    <div className={clsx('my-[30px] first:mt-0 last:mb-0')}>
      {value?.groups?.map((group, i) => (
        <Disclosure key={group._key}>
          {({open}: {open: boolean}) => (
            <div className="flex flex-col border-b border-b-gray">
              <Disclosure.Button
                className={clsx(
                  'flex items-center justify-between py-4 text-[14px] font-bold transition-opacity duration-200 ease-out',
                  'hover:opacity-60',
                  `${i === 0 ? 'pt-0' : ''}`,
                )}
              >
                <div className="text-left leading-[20px]">{group.title}</div>
                <div className="ml-4 shrink-0">
                  {open ? <MinusIcon /> : <PlusIcon />}
                </div>
              </Disclosure.Button>
              <Disclosure.Panel className="border-t border-t-gray pb-4 pt-[6px] text-[14px]">
                <PortableText blocks={group.body} />
              </Disclosure.Panel>
            </div>
          )}
        </Disclosure>
      ))}
    </div>
  );
}
