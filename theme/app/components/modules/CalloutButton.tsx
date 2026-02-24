import clsx from 'clsx';

import Button, {squareButtonStyles} from '~/components/elements/Button';
import {Link} from '~/components/Link';
import type {SanityModuleCalloutButton} from '~/lib/sanity';
import {useColorTheme} from '~/lib/theme';

type Props = {
  module: SanityModuleCalloutButton;
};

export default function CalloutModuleButton({module}: Props) {
  const colorTheme = useColorTheme();

  return (
    <div className="page-width md:px- w-full px-5" key="calloutButton">
      <div
        className="mr-auto flex flex-col items-center"
        style={{color: colorTheme?.text}}
      >
        {/* Link */}
        {module.link && (
          <div
            className={`flex justify-center ${
              module.cssClass && `${module.cssClass}`
            }`}
          >
            <Link
              className="flex w-full justify-center"
              to={`${module.link._type == 'linkInternal' && module.link.slug}`}
              key={module._key}
            >
              <Button
                className={clsx([
                  squareButtonStyles({mode: 'default', tone: 'default'}),
                  'w-[240px]',
                ])}
                type="button"
                style={{
                  background: module.colorTheme?.background,
                  color: module.colorTheme?.text,
                }}
              >
                {module.link.title}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
