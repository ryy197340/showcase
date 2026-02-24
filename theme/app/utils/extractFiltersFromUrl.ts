export function extractFiltersFromUrl(
  searchParams: URLSearchParams,
): Record<string, string | string[]> {
  const filters: Record<string, number | string | string[]> = {};

  for (const [key, value] of searchParams.entries()) {
    if (key === 'filters[price]') {
      const priceRange = value.split('-');
      filters['price_min'] = Number(priceRange[0]) || 0;
      filters['price_max'] = Number(priceRange[1]) || 0;
      continue;
    }
    const match = key.match(/^filters\[(.+?)\]$/);
    if (match) {
      const filterKey = match[1];
      filters[filterKey] = value
        .split(',')
        .map((v) => decodeURIComponent(v.trim()))
        .filter(Boolean); // remove empty strings
    }
  }

  return filters;
}
