import clsx from 'clsx';
import {v4 as uuidv4} from 'uuid';

import LinkButton from '~/components/elements/LinkButton';
import HeroContent from '~/components/heroes/HeroContent';
import type {SanityHeroHome} from '~/lib/sanity';

type Props = {
  hero: SanityHeroHome;
  fullWidth?: boolean;
};
export default function HomeHero({hero, fullWidth}: Props) {
  return (
    <div
      className={clsx(
        'mb-2 flex flex-col items-center',
        fullWidth ? 'md:px-0' : 'md:px-10',
      )}
    >
      {/* Title */}
      {hero.title && (
        <h1
          className={clsx(
            'mb-7 max-w-[60rem] whitespace-pre-line text-center text-3xl',
            'md:text-5xl',
          )}
        >
          {hero.title}
        </h1>
      )}

      {/* Link */}
      {hero.link && <LinkButton link={hero.link} />}

      {/* Hero content */}
      {hero.content && (
        <div
          className={clsx(
            'mt-0 w-full', //
          )}
        >
          {hero.content?.map((heroContentBlock) => (
            <HeroContent
              key={uuidv4()}
              content={heroContentBlock}
              fullWidth={fullWidth}
            />
          ))}
        </div>
      )}
    </div>
  );
}
