export const SHOPIFY_ADMIN_LOCATIONS = `
  query {
    locations(first: 5) {
      edges {
        node {
          id
          name
          address {
            formatted
          }
        }
      }
    }
  }`;

export const SHOPIFY_ADMIN_INVENTORY_ITEM = `
  query inventoryItems($sku: String!) {
    inventoryItems(first: 250, query: $sku) {
      edges {
        node {
        id
        tracked
        sku
        variant {
            inventory_threshold_override: metafield(namespace: "custom", key: "inventory_threshold_override"){
              value
            }
          }
        }
      }
    }
  }`;

export const SHOPIFY_ADMIN_INVENTORY_SET_QUANTITIES = `
  mutation InventorySet($input: InventorySetQuantitiesInput!) {
    inventorySetQuantities(input: $input) {
      inventoryAdjustmentGroup {
        createdAt
        reason
        referenceDocumentUri
        changes {
          name
          delta
        }
      }
      userErrors {
        field
        message
      }
    }
  }`;

export const EXTERNAL_ID_BY_SHOPIFY_LOCATION_ID = `
  query GetLocationExternalId($locationId: ID!) {
    location(id: $locationId) {
      id
      name
      metafield(namespace: "custom", key: "external_id") {
        value
      }
    }
  }
`;
