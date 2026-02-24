export const DEFAULT_SORTING = [
  {
    sort_order: 'asc',
    sort_by: 'null',
    path_in_metadata: 'null',
    display_name: 'Most Relevant',
    position: 0,
    id: 'relevance_descending',
  },
  {
    sort_order: 'asc',
    sort_by: 'price',
    path_in_metadata: 'price',
    display_name: 'Price (Low to High)',
    position: 1,
    id: 'price_ascending',
  },
  {
    sort_order: 'desc',
    sort_by: 'price',
    path_in_metadata: 'price',
    display_name: 'Price (High to Low)',
    position: 2,
    id: 'price_descending',
  },
  {
    sort_order: 'desc',
    sort_by: 'update_date',
    path_in_metadata: 'update_date',
    display_name: 'Newest',
    position: 3,
    id: 'newest_descending',
  },
];
