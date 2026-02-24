export const mapLinkedParentCollections = (
  collection: any,
  allCollections: any,
): any[] => {
  let parentCollection = collection;
  const linkedParentCollections: any[] = [];

  while (parentCollection?.parentCollection?.reference?.id) {
    const parentId = parentCollection.parentCollection.reference.id;
    const parentCollectionRef = allCollections?.collections?.edges?.find(
      (e: any) => e.node.id === parentId,
    );

    if (!parentCollectionRef) break;

    parentCollection = parentCollectionRef.node;
    linkedParentCollections.push(parentCollection);
  }
  return linkedParentCollections;
};

export const groupCollectionsByParent = (
  allCollections: any,
  collection: any,
  currentCollectionPath: any,
) => {
  const groupCollections = allCollections.collections.edges.filter(
    (item: any) => item.node?.parentCollection?.reference?.id == collection?.id,
  );

  const groupData = groupCollections
    .map((item: any) => {
      const displayName =
        item.node.displayTitle?.value ?? item.node.title.split('/').pop();
      return {
        ...item.node,
        display_name: displayName,
        group_id: item.node.handle,
      };
    })
    .sort((a: any, b: any) => a.display_name.localeCompare(b.display_name));
  const groups = [
    {
      children: [...groupData],
      display_name: collection.title,
      group_id: collection.handle,
      parents: [
        ...currentCollectionPath.map((item: string) => {
          return {
            display_name: item,
          };
        }),
      ],
    },
  ];
  return groups;
};

export const normalizeParentCollections = (
  linkedParentCollections: any,
  currentCollectionPath: any,
  EXCLUDED_CATEGORIES: any,
  currentCollectionDisplayName: any,
) => {
  return [...linkedParentCollections]
    .reverse()
    .filter(
      (item) =>
        item.title?.trim() !== '' &&
        !EXCLUDED_CATEGORIES.includes(item.title?.trim()),
    )
    .map((item, index) => ({
      ...item,
      breadcrumbDisplayTitle: {
        value:
          (currentCollectionPath[index] !== currentCollectionDisplayName &&
          !containsAnyWordRegex(item.handle, currentCollectionDisplayName)
            ? currentCollectionPath[index]
            : item.displayTitle?.value) ?? item.title,
      },
    }));
};

function containsAnyWordRegex(slug: string, phrase: string): boolean {
  const words = phrase.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const re = new RegExp(
    `\\b(?:${words
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')})\\b`,
    'i',
  );
  return re.test(slug);
}
