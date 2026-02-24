import {DisplayOptions} from '../sanity/types';

export type CioSearchResult = {
  request: CioSearchRequest;
  response: CioSearchResponse | CioSearchResponseRedirect;
  result_id: string;
};

export type CioSearchResponseRedirect = {
  redirect: {
    data: RedirectData;
    matched_terms: string[];
    matched_user_segments: any;
  };
  result_id: string;
};

export type RedirectData = {
  match_id: number;
  rule_id: number;
  url: string;
};

export type Features = {
  query_items?: boolean;
  a_a_test?: boolean;
  auto_generated_refined_query_rules?: boolean;
  manual_searchandizing?: boolean;
  personalization?: boolean;
  filter_items?: boolean;
  use_reranker_service_for_search?: boolean;
  use_reranker_service_for_browse?: boolean;
  use_reranker_service_for_all?: boolean;
  custom_autosuggest_ui?: boolean;
  disable_test_only_global_rules_search?: boolean;
  disable_test_only_global_rules_browse?: boolean;
};

export type FeatureVariants = {
  query_items?: string;
  a_a_test?: any;
  auto_generated_refined_query_rules?: string;
  manual_searchandizing?: any;
  personalization?: string;
  filter_items?: string;
  use_reranker_service_for_search?: string;
  use_reranker_service_for_browse?: any;
  use_reranker_service_for_all?: any;
  custom_autosuggest_ui?: any;
  disable_test_only_global_rules_search?: any;
  disable_test_only_global_rules_browse?: any;
};

export type FMTOptions = {
  groups_start?: string;
  groups_max_depth?: number;
  show_hidden_facets?: boolean;
  show_hidden_fields?: boolean;
  show_protected_facets?: boolean;
};

export type CioSearchRequest = {
  collection_id: string;
  features?: Features;
  feature_variants?: FeatureVariants;
  fmt_options?: FMTOptions;
  num_results_per_page?: number;
  offset?: number;
  page?: number;
  searchandized_items: any;
  section: string;
  sort_by?: string;
  sort_order?: string;
  term?: any;
};

export type CioSearchResponse = {
  result_sources: CioResultSources;
  facets: CioFacet[];
  groups: CioGroup[];
  sort_options: CioSortOption[];
  refined_content?: CioRefinedContent[];
  results: CioResult[];
  total_num_results: number;
};

export type CioRefinedContent = {
  data: JSON;
};

export type CioResultSources = {
  token_match: {
    count: number;
  };
  embeddings_match: {
    count: number;
  };
};

export type CioFacet = {
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

export type CioGroup = {
  data: any;
  children?: CioGroup[];
  count?: number;
  display_name: string;
  group_id: string;
  parents?: string[];
};

export type CioResultLabels = {
  __cnstrc_is_new_arrivals?: {
    display_name?: string;
  };
  __cnstrc_is_bestseller?: {
    display_name?: string;
  };
  __cnstrc_is_trending_now?: {
    display_name?: string;
  };
  is_sponsored?: boolean;
};

export type CioResult = {
  data: CioResultData;
  is_slotted: boolean;
  labels: CioResultLabels;
  matched_terms: [any];
  result_id?: string;
  value: string;
  variations_map: VariationsMap;
};

export type CioResultData = {
  activation_date: any;
  bestseller: any;
  color?: string;
  description?: string;
  groups: {
    display_name: string;
    group_id: string;
    path: string;
  }[];
  facets: any;
  family?: string;
  id: string;
  image_url: string;
  price?: number;
  compare_at_price?: number;
  shopify_id?: number;
  swatch_image: string;
  back_image?: string;
  url: string;
  variation_id: string;
  publishedAt: string;
  preorder_message?: string;
  top_rated_badge?: string;
};

export interface Variation {
  firstImage: string;
  minPrice: number;
  maxPrice: number;
  shopify_id: number;
  swatch_image: string;
  back_image?: string;
  url: string;
  data?: any;
}

export type VariationsMap = {
  [color: string]: Variation;
};

export type CioVariation = {
  value: string;
  data?: {
    color?: string;
    image_url: string;
    price?: number;
    shopify_id?: number;
    url: string;
    variation_id: string;
    swatch_image?: string;
    preorder_message?: string;
    top_rated_badge?: string;
  };
};

export type CioSortOption = {
  sort_by: string;
  sort_order: 'ascending' | 'descending';
  display_name: string;
  status: 'selected' | '';
};

export type CioBrowseFeatures = {
  display_name: string;
  enabled: boolean;
  feature_name: string;
  variant: any | null;
};

export type CioBrowseResult = {
  request: any;
  response: CioBrowseResponse;
  result_id: string;
};

export type CioBrowseResponse = {
  result_sources: CioResultSources;
  features: CioBrowseFeatures[];
  facets: CioFacet[];
  collection: CioCollectionStructure;
  groups: CioGroup[];
  sort_options: SortOption[];
  refined_content?: CioRefinedContent[];
  results: CioResult[];
  total_num_results: number;
  result_id: string;
};

export type CioCollectionStructure = {
  collection_id: string;
  display_name: string;
  data: JSON;
};

export type ParentGroup = {
  display_name: string;
  group_id: string;
};

export type ChildGroup = {
  children: ChildGroup[];
  count: number;
  data: any;
  display_name: string;
  group_id: string;
  parents: ParentGroup[];
};

export type Group = {
  children: ChildGroup[];
  count: number;
  data: any;
  display_name: string;
  group_id: string;
  parents: ParentGroup[];
};

export type SortOption = {
  sort_order: 'ascending' | 'descending';
  sort_by: string;
  path_in_metadata: string;
  display_name: string;
  position: number;
  id: string;
};

export type FacetOption = {
  display_name: string;
  value: string;
  count: number;
  status: string | null | undefined;
  data: object;
};

export type BaseFacet = {
  name: string;
  display_name: string;
  hidden: boolean;
  data: object;
};

export interface MultiplesFacet extends BaseFacet {
  type: 'multiple';
  options: FacetOption[];
}

export interface RangeFacet extends BaseFacet {
  type: 'range';
  max: number;
  min: number;
  status: any;
}

export type Facet = RangeFacet | MultiplesFacet;

export type AutocompleteResponse = {
  [x: string]: any;
  request: AutocompleteRequest;
  sections: AutocompleteSections;
  result_id: string;
  total_num_results_per_section?: {
    Products: number;
    'Search Suggestions': number;
  };
};

export type AutocompleteRequest = {
  feature_variants: FeatureVariants;
  features: Features;
  num_results_Products: number;
  'num_results_Search Suggestions': number;
  searchandized_items: any;
  term: string;
};

export type AutocompleteSections = {
  'Search Suggestions': SearchSuggestion[];
  Products: AutocompleteProduct[];
};

export type SearchSuggestion = CioResult;

export type AutocompleteProduct = CioResult;

export type CioBsResult = {
  data: CioBsResultData;
  is_slotted: boolean;
  labels: {
    is_sponsored?: boolean;
  };
  matched_terms: [any];
  result_id?: string;
  strategy: {
    id: string;
  };
  value: string;
  variations: CioVariation[];
  family: string;
};

export type CioBsResultData = {
  color?: string;
  description?: string;
  group_ids: string[];
  id: string;
  image_url: string;
  price?: number;
  compare_at_price?: number;
  shopify_id?: number;
  swatch_image: string;
  back_image?: string;
  url: string;
  variation_id: string;
  preorder_message?: string;
  bestseller: boolean;
  activation_date: string;
};

export type CioBsDataAttributes = {
  dataCnstrcPodId: string;
  dataCnstrcNumResults: number;
  dataCnstrcResultId: string;
};

export type CioBsRecommendationResultProps = {
  items: CioBsResult[];
  dataAttributes: CioBsDataAttributes;
  displayOptions?: DisplayOptions;
  isRestingSearch?: boolean;
};

export type CioBsRecommendationsResponse = {
  response: {
    results: CioBsResult[];
    total_num_results: number;
    pod: {
      display_name: string;
      id: string;
    };
  };
  result_id: string;
};
