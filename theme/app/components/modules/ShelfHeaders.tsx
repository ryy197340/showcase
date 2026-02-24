import {Link} from '@remix-run/react';

import {ShelfHeaders} from '~/lib/sanity';

type Props = {
  module: ShelfHeaders;
};

export default function ShelfHeadersModule({module}: Props) {
  if (!module) {
    return null;
  }
  return (
    <div className="flex flex-col">
      <div
        className={`breadcrumb page-width-1200 mx-5 mb-1 flex min-h-9 items-center gap-x-[10px] self-center overflow-scroll px-5 md:overflow-auto ${
          module?.hideOnMobile ? 'hidden md:flex' : 'min-h-10'
        }`}
      >
        {module?.links.length > 0 &&
          module.links.map((singleLink, index) => {
            return (
              <span
                className={`flex cursor-pointer py-2 ${index}`}
                key={singleLink._key}
              >
                {index > 0 && (
                  <span aria-hidden="true" className="child">
                    |
                  </span>
                )}
                <button
                  className="cursor-pointer whitespace-nowrap pl-2 text-left text-sm text-primary hover:underline"
                  type="button"
                >
                  <Link to={singleLink.slug}>{singleLink.title}</Link>
                </button>
              </span>
            );
          })}
      </div>
    </div>
  );
}
