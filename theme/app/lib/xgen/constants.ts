// NOTE: All `name` values are used as the default display name if one is
// not provided in the XGen response.
export const XGEN_PODS = {
  HP_BEST_SELLERS: {
    id: 'sm_el_5fb68693c88d4a8cb14444c263f26ff3',
    name: 'Best of Sale',
  },
  SEARCH_TRENDING_NOW: {
    id: 'sm_el_aec0b035b9c1424ea93f58fd68c1017f',
    name: 'Trending Now',
  },
  PLP_RECENTLY_VIEWED: {
    id: 'sm_el_3b8c6b6722654e69aea031c88b4bb842',
    name: 'Recently Viewed',
  },
  PLP_BEST_SELLERS: {
    id: 'sm_el_05517947446f48e5a62fb94168a9a646',
    name: 'Best of Sale',
  },
  PDP_SIMILAR_STYLES: {
    id: 'sm_el_06ad6c5d2536456a942040a0bd5f4d10',
    name: 'Similar Styles',
  },
  PDP_BEST_SELLERS: {
    id: 'sm_el_af77398fd41b4bccaa6a8e88e3dca7f8',
    name: 'Best Sellers',
  },
  PDP_RECOMMENDATIONS: {
    id: 'sm_el_feb8b5a5ee7f40eca7d2b84803432fbb',
    name: 'Recommend',
  },
  PDP_PAIR_WITH: {
    id: 'sm_el_c82918d938cd4d4a8ebf18ceb3e75b72',
    name: 'Pair With',
  },
  CART_MORE_TO_EXPLORE: {
    id: 'sm_el_2f6e594140ec456d9b4f2a663c25751a',
    name: 'More to Explore',
  },
  CART_MORE_YOU_MAY_NEED: {
    id: 'sm_el_74f738b1570e44f0b9a7afccdfe75b6d',
    name: 'More You May Need',
  },
  DEFAULT: {
    id: 'sm_el_a5354630c874482db4d2ba4a559f7ae1',
    name: 'Recommendations',
  },
};

// NOTE: All `name` values are used as the default display name if one is
// not provided in the XGen response.
// TODO: This is meant to be temporary until there is a solution
// to get the pod details from Sanity/XGEN
export const SANITY_XGEN_PODS_MAP = {
  // HP
  'home-page': {
    ...XGEN_PODS.HP_BEST_SELLERS,
    name: 'Best Sellers',
  },
  'home-page-dresses': {
    ...XGEN_PODS.HP_BEST_SELLERS,
    name: 'Best Sellers',
  },
  'home-page-sale': {
    ...XGEN_PODS.HP_BEST_SELLERS,
    name: 'Best of Sale',
  },

  // PLP
  'product-listing-pages': {
    ...XGEN_PODS.PLP_RECENTLY_VIEWED,
    name: 'Recently Viewed',
  },

  // PDP
  'product-detail-page-1': {
    ...XGEN_PODS.PDP_PAIR_WITH,
    name: 'Pair With',
  },
  'product-detail-page-2': {
    ...XGEN_PODS.PDP_SIMILAR_STYLES,
    name: 'Similar Styles',
  },
  'product-detail-page-3': {
    ...XGEN_PODS.PDP_BEST_SELLERS,
    name: 'Best Sellers',
  },
  'product-detail-page-4': {
    ...XGEN_PODS.PDP_RECOMMENDATIONS,
    name: 'Recommended',
  },

  // Cart
  'cart-drawer': {
    ...XGEN_PODS.CART_MORE_TO_EXPLORE,
    name: 'More to Explore',
  },
  'cart-page': {
    ...XGEN_PODS.CART_MORE_YOU_MAY_NEED,
    name: 'More You Might Need',
  },

  // Misc
  'cabana-life-pop-up': {
    ...XGEN_PODS.HP_BEST_SELLERS,
    name: 'Our Favorite Summer Styles',
  },
  'fathers-day-gifts': {
    ...XGEN_PODS.HP_BEST_SELLERS,
    name: 'Some of Our Favorite Gifts',
  },
  'new-arrivals-women-collection-page': {
    ...XGEN_PODS.HP_BEST_SELLERS,
    name: 'Trending Now',
  },
  'women-product-listing-page': {
    ...XGEN_PODS.PLP_BEST_SELLERS,
    name: 'Best Sellers',
  },
  'women-top-product-listing-page': {
    ...XGEN_PODS.PLP_BEST_SELLERS,
    name: 'Styles to Buy Now',
  },
  'product-listing-pages-pants': {
    ...XGEN_PODS.PLP_BEST_SELLERS,
    name: 'Styles to Buy Now',
  },
  'cms_social-campaign-customer-capture_womens': {
    ...XGEN_PODS.HP_BEST_SELLERS,
    name: 'Meet Our Bestsellers—Womens',
  },
  'cms_social-campaign-customer-capture_mens': {
    ...XGEN_PODS.HP_BEST_SELLERS,
    name: 'Instant Favorites—Mens',
  },
  'cms_social-campaign-customer-capture_accessories': {
    ...XGEN_PODS.HP_BEST_SELLERS,
    name: 'Most Loved Accessories',
  },
  'dynamic-bestsellers': {
    ...XGEN_PODS.HP_BEST_SELLERS,
    name: 'Best Sellers',
  },
  'product-listing-pages-dresses': {
    ...XGEN_PODS.PLP_BEST_SELLERS,
    name: 'Bestselling Styles',
  },
  'sale-redirect-page': {
    ...XGEN_PODS.HP_BEST_SELLERS,
    name: 'Explore Our Bestsellers',
  },
  'sale-women-poduct-listing-page': {
    ...XGEN_PODS.PLP_BEST_SELLERS,
    name: 'Best of Sale',
  },
  'collections-trending-now': {
    ...XGEN_PODS.PDP_SIMILAR_STYLES,
    name: 'Filtered',
  },
};

/**
 * Map of XGEN facet names to their display name
 */
export const XGEN_FACET_MAP = {
  gender: 'collection',
  sizes: 'size',
  colors: 'color',
  materials: 'material',
  seasons: 'season',
};
