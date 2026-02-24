import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';

import HeroContent from '~/components/heroes/HeroContent';
import type {SanityHeroCollection} from '~/lib/sanity';
import {useColorTheme} from '~/lib/theme';

type Props = {
  fallbackTitle: string;
  hero?: SanityHeroCollection;
  customPageTitle?: string;
};

export default function CollectionHero({fallbackTitle, hero}: Props) {
  const colorTheme = useColorTheme();

  if (hero) {
    return (
      <div className="page-width">
        {/* hero content, image */}
        {hero.image?.url && (
          <div className="hidden flex-col-reverse md:flex md:flex-row">
            <div
              className="child flex min-h-[240px] w-full flex-grow flex-col justify-center gap-5 px-5 pb-[70px] pt-11 align-middle md:min-h-[420px] md:w-1/2 md:px-8 md:pb-11"
              style={{background: colorTheme?.background || 'white'}}
            >
              {/* Title */}
              {hero.title && (
                <h2
                  className={clsx(
                    'h1 mx-auto max-w-[60rem] whitespace-pre-line text-center font-hoefler text-[40px]',
                    'md:text-[44px]',
                  )}
                  style={{color: colorTheme?.text || '#13294E'}}
                >
                  {hero.title}
                </h2>
              )}

              {/* Description */}
              {hero.description && (
                <div
                  className="mx-auto max-w-[40rem] whitespace-pre-line text-center text-[14px] leading-paragraph"
                  style={{color: colorTheme?.text || 'black'}}
                >
                  {hero.description}
                </div>
              )}
            </div>

            {hero.image?.url && (
              <div className="child flex w-full flex-grow md:w-1/2">
                <Image
                  src={hero.image.url}
                  alt={hero.altText}
                  height={hero.image.height}
                  width={hero.image.width}
                  className={`h-full object-cover ${
                    hero.imageMobile?.url ? 'hidden md:block' : 'block'
                  }`}
                  loading="eager"
                />
                {hero.imageMobile?.url && (
                  <Image
                    src={hero.imageMobile.url}
                    alt={hero.altText}
                    height={hero.imageMobile.height}
                    width={hero.imageMobile.width}
                    className="block object-cover md:hidden"
                    loading="eager"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Hero content */}
        {hero.content && <HeroContent content={hero.content} />}
      </div>
    );
  }
}
