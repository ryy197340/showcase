import Link from '~/components/elements/Link';
import {HelpNav as HelpNavType} from '~/lib/sanity';
type Props = {
  helpNav: HelpNavType;
};

export default function HelpNav({helpNav}: Props) {
  return (
    <ul className="flex flex-wrap justify-end gap-x-8 gap-y-4 px-5 pb-3 pt-6 text-center md:py-4">
      {helpNav.map(
        (item) =>
          item && (
            <li
              key={item._key}
              className="after:contents('') relative after:absolute after:h-full after:w-4 after:border-r after:border-lightGray last:after:border-none"
            >
              <Link link={item} className="text-2xs">
                {item.title}
              </Link>
            </li>
          ),
      )}
    </ul>
  );
}
