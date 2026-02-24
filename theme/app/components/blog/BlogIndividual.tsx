import clsx from 'clsx';
import {v4 as uuidv4} from 'uuid';

import ModuleGrid from '~/components/modules/ModuleGrid';
type Props = {
  blogPosts?: any;
};

export default function BlogIndividual({blogPosts}: Props) {
  if (!blogPosts) {
    return null;
  }
  return (
    <div className="py-10" key={uuidv4()}>
      <div className="blog-individual page-width w-full">
        {blogPosts && (
          <div
            key={blogPosts[0]._id}
            className={clsx(
              'blog-modules flex flex-col gap-y-4 overflow-hidden text-sm text-primary',
            )}
          >
            <ModuleGrid items={blogPosts[0].modules} />
          </div>
        )}
      </div>
    </div>
  );
}
