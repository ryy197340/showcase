import {useNavigate} from '@remix-run/react';
import {useCallback} from 'react';

type BreadcrumbGroupProps = {
  collection?: any;
  group: Group;
  onGroupClick: (id: string) => void;
  parentCollections?: any;
};

const BreadcrumbGroup = ({
  collection,
  group,
  onGroupClick,
  parentCollections,
}: BreadcrumbGroupProps) => {
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

  return (
    <div className="flex min-h-8 flex-col">
      {/* Breadcrumb Links */}
      <div
        className={`breadcrumb mx-5 mb-1 ml-auto mr-auto flex min-h-[30px] w-full ${
          parentCollections &&
          collection?.showBreadcrumbsOnMobile?.value === 'true'
            ? ''
            : 'hidden md:flex'
        } items-center justify-start gap-x-[10px] overflow-scroll px-5 text-primary md:mb-10 md:flex-wrap md:overflow-auto `}
        role="navigation"
        key="breadcrumb-links"
      >
        {parentCollections &&
          parentCollections.map((parent, parentIndex) =>
            parent?.hideCollectionFromBreadcrumb?.value === 'true' ? null : (
              <div
                key={parent.title}
                className="source-parent flex flex-shrink-0 cursor-pointer flex-row gap-x-[10px] py-2"
              >
                <a
                  className="whitespace-nowrap text-saleGray md:whitespace-normal"
                  href={
                    parentIndex === 0
                      ? '/'
                      : `/collections/${encodeURIComponent(parent.handle)}`
                  }
                  aria-label={`Navigate to ${
                    parentIndex === 0 ? 'Home' : parent.title
                  }`}
                >
                  {parentIndex === 0 ? (
                    <span>Home</span>
                  ) : (
                    <span>
                      {parent.breadcrumbDisplayTitle &&
                      parent.breadcrumbDisplayTitle.value
                        ? parent.breadcrumbDisplayTitle.value
                        : parent.displayTitle && parent.displayTitle.value
                        ? parent.displayTitle.value
                        : parent.title}
                    </span>
                  )}
                </a>
                {parent.hideCollectionFromBreadcrumb?.value !== 'true' &&
                  parentIndex !== parentCollections.length - 1 &&
                  parentCollections[parentIndex + 1]
                    .hideCollectionFromBreadcrumb?.value !== 'true' && (
                    <span
                      aria-hidden="true"
                      className={`${parent.title} ${parentIndex} ${parentCollections.length}`}
                    >
                      /
                    </span>
                  )}
              </div>
            ),
          )}
        {!parentCollections &&
          group.parents &&
          group.parents.map((parent, parentIndex) => (
            <div
              key={parent.group_id}
              className="source-group invisible flex flex-shrink-0 cursor-pointer flex-row gap-x-[10px] py-2"
            >
              <a
                className="whitespace-nowrap text-saleGray md:whitespace-normal"
                href={`/collections/${encodeURIComponent(parent.group_id)}`}
                aria-label={`Navigate to ${parent.display_name}`}
              >
                <span>{parent.display_name}</span>
              </a>
              {parentIndex !== group.parents.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`${parent.display_name} ${parentIndex} ${group.parents.length}`}
                >
                  /
                </span>
              )}
            </div>
          ))}
        <div
          className={`current flex flex-shrink-0 flex-row gap-x-[10px] py-2 ${
            parentCollections &&
            collection &&
            collection?.hideCollectionFromBreadcrumb?.value === 'true'
              ? 'hidden'
              : ''
          }`}
          key={`${collection?.title}`}
        >
          {parentCollections &&
          parentCollections[parentCollections.length - 1].handle ? (
            <span aria-hidden="true" className="test2">
              /
            </span>
          ) : null}
          <span>
            {
              parentCollections && // Check if parentCollections is truthy
                collectionDisplayName // If none of the above conditions are true, return null
            }
          </span>
        </div>
      </div>
    </div>
  );
};

import {Group} from '~/lib/constructor/types';
type FilterBreadCrumbsProps = {
  collection?: any;
  groups: Group[];
  parentCollections?: any;
};

export default function FilterBreadcrumbs({
  collection,
  groups,
  parentCollections,
}: FilterBreadCrumbsProps) {
  const navigate = useNavigate();

  const onGroupClick = useCallback(
    (id: string) => {
      id === '/' ? navigate('/') : navigate(`/collections/${id}`);
    },
    [navigate],
  );
  return (
    <nav className="flex h-[30px] min-h-[30px] flex-row gap-x-[10px] pb-4 text-[12px] text-saleGray">
      {groups.map((group) => (
        <div key={group.group_id} className="w-full">
          {parentCollections.length > 0 && (
            <BreadcrumbGroup
              collection={collection}
              group={group}
              onGroupClick={onGroupClick}
              parentCollections={parentCollections}
            />
          )}
        </div>
      ))}
    </nav>
  );
}
