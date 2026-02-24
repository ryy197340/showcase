export type SortParams = {
  sortBy?: 'price' | 'update_date';
  sortOrder?: 'asc' | 'desc';
};

export function extractSortFromUrl(searchParams: URLSearchParams): SortParams {
  const sortBy = searchParams.get('sort_by') ?? undefined;

  const sortOrderRaw = searchParams.get('sort_order');
  const sortOrder =
    sortOrderRaw === 'asc' || sortOrderRaw === 'desc'
      ? sortOrderRaw
      : undefined;

  return {sortBy: sortBy as 'price' | 'update_date' | undefined, sortOrder};
}
