import type { GadgetSettings } from "gadget-server";

export const settings: GadgetSettings = {
  type: "gadget/settings/v1",
  frameworkVersion: "v1.4.0",
  plugins: {
    connections: {
      shopify: {
        apiVersion: "2025-07",
        enabledModels: [],
        type: "partner",
        scopes: [
          "read_products",
          "read_customers",
          "read_customer_merge",
          "read_cart_transforms",
          "read_shopify_payments_accounts",
          "write_customers",
          "read_channels",
          "read_gdpr_data_request",
          "read_all_cart_transforms",
        ],
      },
    },
  },
};
