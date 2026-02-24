import {useLoaderData} from '@remix-run/react';

import {Link as HydrogenLink} from '~/components/Link';
import {SanityCollectionPage} from '~/lib/sanity';
import {
  EXCLUDED_CATEGORIES,
  loader,
} from '~/routes/($lang).collections.$handle';
import {groupCollectionsByParent} from '~/utils/bredcrumbUtils';

function CollectionSSR() {
  // NOTE: This component is currently only used for returning breadcrumbs
  // expand this component to include more of the collection page during PLP CSR to SSR conversion work
  const {collection, page, allCollections} = useLoaderData<
    typeof loader
  >() as unknown as {
    collection: any;
    page: SanityCollectionPage;
    allCollections: any;
  };

  const title = page?.seo?.title ?? collection?.seo?.title ?? collection?.title;
  const h1 = collection.displayTitle
    ? collection.displayTitle.value
    : page.customPageTitle
    ? page.customPageTitle
    : page.title;

  const ssrBreadcrumbs = {
    handle: page?.slug,
    title,
  };
  const displayCategory =
    collection.displayableCategory?.value ?? collection.title;
  const currentCollectionPath = [
    'All',
    ...displayCategory
      .split('/')
      .map((item: string) => item.trim())
      .filter((item) => item && !EXCLUDED_CATEGORIES.includes(item)),
  ];

  const breadcrumbGroups = groupCollectionsByParent(
    allCollections,
    collection,
    currentCollectionPath,
  );

  return (
    <>
      <nav aria-label="breadcrumb">
        <ol>
          <li>
            <a href="https://www.jmclaughlin.com/">Home</a>
          </li>
          <li>
            <a
              href={`https://www.jmclaughlin.com/collections/${ssrBreadcrumbs.handle}`}
            >
              {title}
            </a>
          </li>
        </ol>
      </nav>
      <h1>{h1}</h1>
      {breadcrumbGroups?.[0]?.children?.map((group) => {
        return (
          <HydrogenLink
            to={`/collections/${group.group_id}`}
            key={group.group_id}
          >
            {group.display_name}
          </HydrogenLink>
        );
      })}
    </>
  );
}

export default CollectionSSR;
