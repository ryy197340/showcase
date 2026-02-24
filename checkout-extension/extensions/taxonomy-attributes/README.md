# Taxonomy Attributes Extension

This extension reads taxonomy metafields from product variants and adds them as cart line attributes.

## Features

- Reads `taxonomy.department`, `taxonomy.sub_department`, `taxonomy.class`, and `taxonomy.sub_class` metafields from product variants
- Automatically adds these values as cart line attributes with `_department`, `_sub_department`, `_class`, and `_sub_class` keys
- Only updates cart lines that don't already have these attributes set

## Configuration

The extension is configured to target `checkout.order-summary.render` and requires the following metafields to be configured in `shopify.extension.toml`:

- `taxonomy.department` (product_variant)
- `taxonomy.sub_department` (product_variant)
- `taxonomy.class` (product_variant)
- `taxonomy.sub_class` (product_variant)

