import {v4 as uuidv4} from 'uuid';

import {ListColumns as ListColumnsType} from '~/lib/sanity';
import {DEFAULT_COLOR_THEME} from '~/lib/utils';

type Props = {
  module?: ListColumnsType;
  hero?: boolean;
};

export default function ListColumns({module, hero}: Props) {
  if (!module) {
    return null; // Return null or handle the case when content is not available.
  }
  if (!module.colorTheme) {
    module.colorTheme = DEFAULT_COLOR_THEME;
  }
  if (module.columns?.length > 0 || module.bottomContent || module.heading) {
    return (
      <div
        className="page-width py-15 md:px-[120px]"
        style={{
          color: module.colorTheme.text,
          background: module.colorTheme.background,
        }}
      >
        {module.heading && (
          <h2 className="mb-6 text-center text-xl2">{module.heading}</h2>
        )}
        {module.columns?.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {module.columns?.map((column, index) => {
              const columnStringArray = module.columns[
                index
              ].columnStrings?.filter((str) => str.trim() !== '');
              return (
                <div
                  key={uuidv4()}
                  className="shadow-md rounded-lg p-4 px-5 pb-0"
                >
                  <h3 className="mb-4 text-lg2">{column.columnHeading}</h3>
                  <ul className="list-none text-sm">
                    {columnStringArray?.map((string) => (
                      <li key={uuidv4()} style={{lineHeight: '20px'}}>
                        {string}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        {module.bottomContent && (
          <p className="mt-6 text-center font-hoefler text-lg2 italic">
            {module.bottomContent}
          </p>
        )}
      </div>
    );
  }

  return null;
}
