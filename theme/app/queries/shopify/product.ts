export const PRODUCT_VARIANT_FIELDS = `
  fragment ProductVariantFields on ProductVariant {
    availableForSale
    compareAtPrice {
      currencyCode
      amount
    }
    id
    image {
      altText
      height
      id
      url
      width
    }
    price {
      currencyCode
      amount
    }
    selectedOptions {
      name
      value
    }
    title
    sku
    quantityAvailable
    unitPrice {
      amount
      currencyCode
    }
    product {
      title
      handle
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

export const PRODUCT_FIELDS = `
  fragment ProductFields on Product {
    handle
    seo {
      description
      title
    }
    id
    options {
      name
      values
    }
    title
    vendor
    description
    descriptionHtml
    tags
    publishedAt
    parentSku: metafield(namespace: "merchandising", key: "parent_sku") {
      value
    }
    styleNumber: metafield(namespace: "merchandising", key: "style_number") {
      value
    }
    details: metafield(namespace: "merchandising", key: "details") {
      value
    }
    designedToFit: metafield(namespace: "merchandising", key: "designed_to_fit") {
      value
    }
    activation_date: metafield(namespace: "custom", key: "activation_date") {
      value
    }
    bestSeller: metafield(namespace: "merchandising", key: "best_seller") {
      value
    }
    topRated: metafield(namespace: "merchandising", key: "top_rated_badge") {
      value
    }
    preorderMessage: metafield(namespace: "merchandising", key: "preorder_message") {
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
        }
      }
    }
    displayableCategory: metafield(namespace: "custom", key: "displayable_category") {
      value
    }
    finalSale: metafield(namespace: "custom", key: "final_sale") {
      value
    }
    pairWithTxt: metafield(namespace: "custom", key: "pair_with_text") {
      value
    }
    pdpBreadcrumb: metafield(namespace: "merchandising", key: "pdp_breadcrumb") {
      references(first: 10) {
        nodes {
          ... on Collection {
            id
            handle
            title
            description
            breadcrumbDisplayTitle: metafield(namespace: "custom", key: "breadcrumb_display_title") {
              value
            }
            displayTitle: metafield(namespace: "custom", key: "display_title") {
              value
            }
          }
        }
      }
    }
      viewMore: metafield(namespace: "custom", key: "view_more_pdp_details_tab") {
      references(first: 10) {
        nodes {
          ... on Collection {
            id
            handle
            title
            description
            breadcrumbDisplayTitle: metafield(namespace: "custom", key: "breadcrumb_display_title") {
              value
            }
            displayTitle: metafield(namespace: "custom", key: "display_title") {
              value
            }
          }
        }
      }
    }
    back_image: metafield(namespace: "merchandising", key: "back_image") {
      reference {
        ... on MediaImage {
          image {
            url
          }
        }
      }
    }
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
  }
`;

export const PRODUCT_QUERY = `#graphql
  ${PRODUCT_FIELDS}
  ${PRODUCT_VARIANT_FIELDS}

  query product($country: CountryCode, $language: LanguageCode, $handle: String!, $selectedOptions: [SelectedOptionInput!]!)
  @inContext(country: $country, language: $language) {
    product(handle: $handle) {
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
      selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
        ...ProductVariantFields
      }
      variants(first: 250) {
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
      shortDescription: metafield(namespace: "merchandising", key: "short_description") {
        value
      },
      marketingText: metafield(namespace: "merchandising", key: "marketing_text") {
        value
      },
    }
  }
`;

export const PRODUCTS_AND_VARIANTS = `#graphql
  ${PRODUCT_FIELDS}
  ${PRODUCT_VARIANT_FIELDS}

  query products(
    $country: CountryCode
    $language: LanguageCode
    $ids: [ID!]!
    $variantIds: [ID!]!
  ) @inContext(country: $country, language: $language) {
    products: nodes(ids: $ids) {
      ... on Product {
        ...ProductFields
      }
    }
    productVariants: nodes(ids: $variantIds) {
      ... on ProductVariant {
        ...ProductVariantFields
      }
    }
  }
`;

export const PRODUCT_AND_VARIANT = `#graphql
  ${PRODUCT_FIELDS}
  ${PRODUCT_VARIANT_FIELDS}

  query product(
    $country: CountryCode
    $language: LanguageCode
    $id: ID!
    $variantId: ID!
  ) @inContext(country: $country, language: $language) {
    product: product(id: $id) {
      ...ProductFields
    }
    productVariant: node(id: $variantId) {
      ... on ProductVariant {
        ...ProductVariantFields
      }
    }
  }
`;

export const PRODUCTS_AND_COLLECTIONS = `#graphql
  ${PRODUCT_FIELDS}
  ${PRODUCT_VARIANT_FIELDS}

  query productsAndCollections(
    $country: CountryCode
    $language: LanguageCode
    $ids: [ID!]!
  ) @inContext(country: $country, language: $language) {
    productsAndCollections: nodes(ids: $ids) {
      ... on Product {
        ...ProductFields
        variants(first: 250) {
          nodes {
            ...ProductVariantFields
          }
        }
      }
      ... on Collection {
        id
        title
        description
        handle
      }
    }
  }
`;

export const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANT_FIELDS}

  query variants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      variants(first: 250) {
        nodes {
          ...ProductVariantFields
        }
      }
    }
  }
`;

export const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_FIELDS}
  ${PRODUCT_VARIANT_FIELDS}

  query productRecommendations(
    $country: CountryCode
    $language: LanguageCode
    $productId: ID!
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId) {
      ...ProductFields
      variants(first: 1) {
        nodes {
          ...ProductVariantFields
        }
      }
    }
  }
`;

export const COLOR_SWATCH_QUERY = `#graphql
  query colorSwatches($tag: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    products(query: $tag, first: 50) {
      edges {
        node {
          id
          title
          handle
          tags
          totalInventory
          variants(first: 250) {
            edges {
              node {
                quantityAvailable
              }
            }
          }
          options {
            name
            values
          }
          metafield(namespace: "merchandising", key: "swatch_image") {
            reference {
              ... on MediaImage {
                image {
                  url
                }
              }
            }
          }
          bestseller: metafield(namespace: "merchandising", key: "best_seller") {
            value
          }
          activation_date: metafield(namespace: "custom", key: "activation_date") {
            value
          }
        }
      }
    }
  }
`;

export const VARIATIONS_COLOR_SWATCH_QUERY = `#graphql
  query colorSwatches($tag: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    products(query: $tag, first: 50) {
      edges {
        node {
          id
          title
          handle
          tags
          totalInventory
          variants(first: 250) {
            edges {
              node {
                quantityAvailable
              }
            }
          }
          options {
            name
            values
          }
          priceRange {
            maxVariantPrice {
              amount
            }
            minVariantPrice {
              amount
            }
          }
          featuredImage {
            url
          }
          metafield(namespace: "merchandising", key: "swatch_image") {
            reference {
              ... on MediaImage {
                image {
                  url
                }
              }
            }
          }
          back_image: metafield(namespace: "merchandising", key: "back_image") {
            reference {
              ... on MediaImage {
                image {
                  url
                }
              }
            }
          }
          bestseller: metafield(namespace: "merchandising", key: "best_seller") {
            value
          }
          topRated: metafield(namespace: "merchandising", key: "top_rated_badge") {
            value
          }
          preorder_message: metafield(namespace: "merchandising", key: "preorder_message") {
            value
          }
          activation_date: metafield(namespace: "custom", key: "activation_date") {
            value
          }
        }
      }
    }
  }
`;

export const FAMILY_PRODUCT_QUERY = `#graphql
  ${PRODUCT_VARIANT_FIELDS}

  query FamilyProduct($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      handle
      title
      description
      tags
      options {
        name
        values
      }
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
      metafield(namespace: "merchandising", key: "swatch_image") {
        reference {
          ... on MediaImage {
            image {
              url
            }
          }
        }
      }
      bestseller: metafield(namespace: "merchandising", key: "best_seller") {
        value
      }
      activation_date: metafield(namespace: "custom", key: "activation_date") {
        value
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
      variants(first: 250) {
        nodes {
          ...ProductVariantFields
        }
      }
    }
  }
`;

export const PRODUCT_BY_ID_QUERY = `#graphql
  ${PRODUCT_VARIANT_FIELDS}

  query FamilyProduct(
    $id: ID!,
    $country: CountryCode,
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {

    node(id: $id) {
      ... on Product {
        id
        handle
        title
        description
        tags

        options {
          name
          values
        }

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

        metafield(namespace: "merchandising", key: "swatch_image") {
          reference {
            ... on MediaImage {
              image {
                url
              }
            }
          }
        }

        bestseller: metafield(namespace: "merchandising", key: "best_seller") {
          value
        }

        activation_date: metafield(namespace: "custom", key: "activation_date") {
          value
        }

        sizeChart: metafield(namespace: "custom", key: "size_chart") {
          reference {
            ... on Metaobject {
              fields {
                key
                value
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

        variants(first: 250) {
          nodes {
            ...ProductVariantFields
          }
        }
      }
    }
  }
`;

export const EXTENDED_CART_FRAGMENT = `#graphql
  fragment CartApiQuery on Cart {
    id
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      edges {
        node {
          id
          quantity
          attributes {
            key
            value
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            amountPerQuantity {
              amount
              currencyCode
            }
            compareAtAmountPerQuantity {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              sku
              availableForSale
              compareAtPrice {
                ...CartApiMoney
              }
              price {
                ...CartApiMoney
              }
              requiresShipping
              title
              image {
                ...CartApiImage
              }
              product {
                handle
                title
                id
                metafield(namespace: "custom", key: "complete_the_set") {
                  type
                  value
                }
              }
              quantityAvailable
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
    cost {
      subtotalAmount {
        ...CartApiMoney
      }
      totalAmount {
        ...CartApiMoney
      }
      totalDutyAmount {
        ...CartApiMoney
      }
      totalTaxAmount {
        ...CartApiMoney
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      applicable
      code
    }
  }

  fragment CartApiMoney on MoneyV2 {
    currencyCode
    amount
  }

  fragment CartApiImage on Image {
    id
    url
    altText
    width
    height
  }
`;

export function getProductPrices(ids: string[]): string {
  const idsString = ids.map((id) => `"gid://shopify/Product/${id}"`).join(', ');
  const query = `#graphql
  query ProductPrices($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    nodes(ids: [${idsString}]) {
      ... on Product {
        id
        title
        priceRange {
          maxVariantPrice {
            amount
            currencyCode
          }
          minVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          maxVariantPrice {
            amount
            currencyCode
          }
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }`;
  return query;
}
