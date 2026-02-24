import {
  PRODUCT_FIELDS,
  PRODUCT_VARIANT_FIELDS,
} from '~/queries/shopify/product';

const COLLECTION_PRODUCT_VALIDATION_FIELDS = `
  fragment CollectionProductValidationFields on Product {
    id
    handle
    title
  }
`;

const COLLECTION_VARIANT_VALIDATION_FIELDS = `
  fragment CollectionVariantValidationFields on ProductVariant {
    id
    availableForSale
    quantityAvailable
  }
`;

export const ALL_COLLECTIONS_QUERY = `#graphql
  ${COLLECTION_PRODUCT_VALIDATION_FIELDS}
  ${COLLECTION_VARIANT_VALIDATION_FIELDS}
  fragment CollectionDetails on Collection {
    id
    title
    handle
    description
    displayTitle: metafield(namespace: "custom", key: "display_title") {
      value
    }
    breadcrumbDisplayTitle: metafield(namespace: "custom", key: "breadcrumb_display_title") {
      value
    }
    hideAllBreadcrumbs: metafield(namespace: "custom", key: "hide_all_breadcrumbs") {
      value
    }
    hideCollectionFromBreadcrumb: metafield(namespace: "custom", key: "hide_collection_from_breadcrumb") {
      value
    }
    showBreadcrumbsOnMobile: metafield(namespace: "custom", key: "show_breadcrumbs_on_mobile") {
      value
    }
    products(first: 1) {
      nodes {
        ...CollectionProductValidationFields
        variants(first: 1) {
          nodes {
            ...CollectionVariantValidationFields
          }
        }
      }
    }
    xgenCollectionDeploymentId: metafield(namespace: "custom", key: "xgen_custom_collection") {
      value
    }
  }
  query AllCollections($first: Int = 50) {
    collections(first: $first) {
      edges {
        node {
          ...CollectionDetails
          parentCollection: metafield(namespace: "merchandising", key: "parent_id") {
            reference {
              ... on Collection {
                ...CollectionDetails
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const COLLECTION_FIELDS = `
  fragment CollectionFields on Collection {
    id
    title
    description
    handle
    seo {
      description
      title
    }
    displayTitle: metafield(namespace: "custom", key: "display_title") {
      value
    }

    breadcrumbDisplayTitle: metafield(namespace: "custom", key: "breadcrumb_display_title") {
      value
    }
    hideAllBreadcrumbs: metafield(namespace: "custom", key: "hide_all_breadcrumbs") {
      value
    }
    hideCollectionFromBreadcrumb: metafield(namespace: "custom", key: "hide_collection_from_breadcrumb") {
      value
    }
    showBreadcrumbsOnMobile: metafield(namespace: "custom", key: "show_breadcrumbs_on_mobile") {
      value
    }
    parentCollection: metafield(namespace: "merchandising", key: "parent_id") {
      reference {
        ... on Collection {
          id
          title
          handle
          description
        }
      }
    }
    displayableCategory: metafield(namespace: "custom", key: "displayable_category") {
      value
    }
    wPromoteMetaObject:   metafield(namespace: "custom", key: "wpromote_collection_content") {
      reference {
        ... on Metaobject {
          fields {
            key
            type
            value
          }
        }
      }
    }
    xgenCollectionDeploymentId: metafield(namespace: "custom", key: "xgen_custom_collection") {
      value
    }
    products(first: $count, after: $cursor, sortKey: $sortKey, reverse: $reverse) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ...ProductFields
        media(first: 20) {
          nodes {
            ... on MediaImage {
              id
              mediaContentType
              image {
                id
                url
                altText
                width
                height
              }
            }
            ... on Video {
              id
              mediaContentType
              sources {
                mimeType
                url
              }
            }
            ... on ExternalVideo {
              id
              mediaContentType
              host
              originUrl
            }
            ... on Model3d {
              id
              mediaContentType
              sources {
                mimeType
                url
              }
            }
          }
        }
        variants(first: 50) {
          nodes {
            ...ProductVariantFields
          }
        }
        sizeChart: metafield(namespace: "custom", key: "size_chart") {
          reference {
            ... on Metaobject {
              fields {
                value
                key
                reference {
                  ... on MediaImage {
                    image {
                      id
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
            }
          }
          value
          type
        }
      }
    }
  }
`;

export const COLLECTION_QUERY = `#graphql
  ${PRODUCT_FIELDS}
  ${PRODUCT_VARIANT_FIELDS}
  ${COLLECTION_FIELDS}

  query CollectionDetails($country: CountryCode, $language: LanguageCode, $handle: String!, $count: Int!, $cursor: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean)
    @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      ...CollectionFields
    }
  }
`;

export const COLLECTION_QUERY_ID = `#graphql
  ${PRODUCT_FIELDS}
  ${PRODUCT_VARIANT_FIELDS}
  ${COLLECTION_FIELDS}

  query CollectionDetails($country: CountryCode, $language: LanguageCode, $id: ID!, $count: Int!, $cursor: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean)
    @inContext(country: $country, language: $language) {
    collection(id: $id) {
      ...CollectionFields
    }
  }
`;
