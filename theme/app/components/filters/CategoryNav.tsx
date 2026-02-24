import {useNavigate} from '@remix-run/react';
import {useCallback, useMemo} from 'react';

import {Link} from '~/components/Link';

type CategoryNavGroupProps = {
  collection?: any;
  group: Group;
  siblingItems?: any;
  onGroupClick: (id: string) => void;
  parentCollections?: any;
};

const CategoryNavGroup = ({
  collection,
  group,
  siblingItems,
  onGroupClick,
  parentCollections,
}: CategoryNavGroupProps) => {
  let collectionDisplayName = group.display_name;

  if (collection) {
    /*
    If we have collection data from Shopify, use the appropriate display name value in order of preference:
    - collection metafield: breadcrumbDisplayTitle
    - collection metafield: displayTitle
    - collection.title
    - else, use the group.display_name
    */
    collectionDisplayName =
      collection && // Check if collection is truthy
      collection.breadcrumbDisplayTitle && // Check if collection.breadcrumbDisplayTitle exists
      collection.breadcrumbDisplayTitle.value // Return collection.breadcrumbDisplayTitle.value if it exists
        ? collection.breadcrumbDisplayTitle.value // If the above condition is true, return collection.breadcrumbDisplayTitle.value
        : collection && // Check if collection is truthy
          collection.displayTitle && // Check if collection.displayTitle exists
          collection.displayTitle.value // Return collection.displayTitle.value if it exists
        ? collection.displayTitle.value // If the above condition is true, return collection.displayTitle.value
        : collection && collection.title // Check if collection and collection.title exist
        ? collection.title // Return collection.title if it exists
        : group.display_name; // If none of the above conditions are true, return null
  }

  const validCollections = useMemo(() => {
    if (!group.children?.length) return [];

    const collections = group.children.filter(
      (child) =>
        siblingItems?.find((coll: any) => coll.handle === child.group_id)
          ?.hideCollectionFromBreadcrumb?.value !== 'true',
    );

    return collections.map((child) => {
      const childCollection = siblingItems?.find(
        (coll: any) => coll.handle === child.group_id,
      );
      const displayName =
        childCollection?.breadcrumbDisplayTitle?.value ??
        childCollection?.displayTitle?.value ??
        childCollection?.title ??
        child.display_name;
      const to =
        child.group_id === '/'
          ? '/'
          : `/collections/${encodeURIComponent(child.group_id)}`;
      return {
        groupId: child.group_id,
        displayName,
        to,
      };
    });
  }, [group.children, siblingItems]);

  return (
    <div className="flex min-h-10 flex-col">
      {/* Category Links */}
      <div
        className={`breadcrumb page-width-1200 mx-5 mb-1 flex min-h-9 self-center px-5 ${
          collection?.showBreadcrumbsOnMobile?.value === 'true'
            ? ''
            : 'hidden md:flex'
        }${
          parentCollections ? '' : 'invisible'
        } items-center gap-x-[10px] overflow-scroll text-primary md:flex-wrap md:justify-center md:overflow-auto md:py-0 lg:mx-0`}
        role="navigation"
        key="category-links"
      >
        {validCollections?.length > 0 &&
          validCollections.map((child, index) => (
            <span
              className={`flex cursor-pointer py-2 ${index}`}
              key={child.groupId}
            >
              {index > 0 && (
                <span aria-hidden="true" className="child">
                  |
                </span>
              )}
              <Link
                className="cursor-pointer whitespace-nowrap pl-2 text-left text-sm text-primary hover:underline"
                to={child.to}
                prefetch="intent"
              >
                {child.displayName}
              </Link>
            </span>
          ))}
      </div>
    </div>
  );
};

import {Group} from '~/lib/constructor/types';
type CategoryNavProps = {
  collection?: any;
  groups: Group[];
  siblingItems?: any;
  parentCollections?: any;
};

export default function CategoryNav({
  collection,
  groups,
  siblingItems,
  parentCollections,
}: CategoryNavProps) {
  const navigate = useNavigate();

  const onGroupClick = useCallback(
    (id: string) => {
      id === '/' ? navigate('/') : navigate(`/collections/${id}`);
    },
    [navigate],
  );

  return (
    <nav className="flex min-h-6 flex-row gap-x-[10px] pb-4 text-[12px] text-saleGray md:min-h-16">
      {groups.map((group) => (
        <div key={group.group_id} className="w-full">
          {group.parents.length > 0 && (
            <CategoryNavGroup
              collection={collection}
              group={group}
              siblingItems={siblingItems}
              onGroupClick={onGroupClick}
              parentCollections={parentCollections}
            />
          )}
        </div>
      ))}
    </nav>
  );
}
