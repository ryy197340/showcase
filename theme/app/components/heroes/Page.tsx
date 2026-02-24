import HeroContent from '~/components/heroes/HeroContent';
import type {SanityHeroPage} from '~/lib/sanity';
import {useColorTheme} from '~/lib/theme';

type Props = {
  fallbackTitle: string;
  hero?: SanityHeroPage;
};

export default function PageHero({fallbackTitle, hero}: Props) {
  const colorTheme = useColorTheme();
  return (
    <div style={{background: colorTheme?.background}}>
      {/* Hero content */}
      {hero && hero.content && (
        <div className="mt-0">
          <HeroContent content={hero.content} />
        </div>
      )}
    </div>
  );
}
