import {XGEN_FACET_MAP} from '~/lib/xgen/constants';

type CioFacet = {
  name: string;
  display_name: string;
  type: 'single' | 'multiple' | 'range';
  status?: object;
  options?: {
    value: string;
    display_name: string;
    status: string;
    data: any;
    count: number;
  }[];
  hidden: boolean;
  data: any;
};

function singularize(word: string): string {
  // Very basic singularization logic (can be extended or replaced with a library)
  return word.endsWith('s') && word.length > 1 ? word.slice(0, -1) : word;
}

function normalizeFacetGroup(
  key: string,
  values: Record<string, number>,
  type: 'single' | 'multiple' | 'range' = 'multiple',
): CioFacet {
  key = XGEN_FACET_MAP[key as keyof typeof XGEN_FACET_MAP] || key;
  const singularKey = singularize(key);
  return {
    name: singularKey,
    display_name: key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    type: key === 'price' ? 'range' : type,
    status: {},
    options: Object.entries(values)
      .filter(([value]) => value !== '-') // Filter out empty values (hyphen)
      .sort((a, b) =>
        singularKey === 'type'
          ? 0
          : a[0].localeCompare(b[0], undefined, {sensitivity: 'base'}),
      )
      .map(([value, count]) => ({
        value,
        display_name: value,
        status: 'available',
        data: {},
        count,
      })),
    hidden: false,
    data: {},
  };
}

/**
 * Normalize the entire input data object into an array of CioFacet
 */
export function normalizeAllFacets(
  input: Record<string, Record<string, number>> | null | undefined,
): CioFacet[] {
  if (!input) return [];
  return Object.entries(input)
    .filter(([, values]) => Object.keys(values).length > 0) // Filter out empty facets
    .map(([facetName, values]) => {
      return normalizeFacetGroup(facetName, values);
    })
    .filter(
      (facet) =>
        ![
          'gender',
          'configsignaturefabric',
          'category',
          'product_department',
          'configfilterpattern',
          'season',
        ].includes(facet.name),
    )
    .filter((facet) => facet.options?.length); // Final filter to remove empty facets
}
