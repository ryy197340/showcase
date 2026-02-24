import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {validateLocale} from '~/lib/utils';
import {
  EXTERNAL_ID_BY_SHOPIFY_LOCATION_ID,
  SHOPIFY_ADMIN_INVENTORY_ITEM,
  SHOPIFY_ADMIN_INVENTORY_SET_QUANTITIES,
} from '~/queries/shopify/inventory';
import {fetchAptosQty} from '~/utils/product';
export async function loader({params, context}: LoaderFunctionArgs) {
  try {
    validateLocale({context, params});
    const {env} = context;
    const sku = params.id;
    let location = params.location; // optional, use with POS locations
    let externalId: string | undefined;
    const {adminApiClient} = context;
    const toLocationGid = (loc: string) =>
      loc.startsWith('gid://shopify/Location/')
        ? loc
        : `gid://shopify/Location/${loc}`;

    if (!adminApiClient) {
      return new Response('Admin API client is not configured.', {status: 500});
    }

    if (!sku) {
      return new Response('SKU parameter is required', {status: 400});
    }

    if (location) {
      // Accept either a numeric ID or a full GID
      const isNumericId = /^\d+$/.test(location);
      const isGid = location.startsWith('gid://shopify/Location/');
      if (!isNumericId && !isGid) {
        return new Response('Invalid location parameter', {status: 400});
      }

      // if the Shopify location is passed, we must grab the related aptos external Id
      // Get external id by using the shopify location id
      const locationsData = await adminApiClient.request(
        EXTERNAL_ID_BY_SHOPIFY_LOCATION_ID,
        {
          variables: {
            locationId: toLocationGid(location),
          },
        },
      );

      const loc = locationsData?.data?.location;
      if (!loc) {
        return new Response('No matching Shopify location found', {
          status: 404,
        });
      }

      // if the metafield is empty, don't proceed
      const extId = loc.metafield?.value;
      if (!extId) {
        return new Response(
          'Location missing required metafield custom.external_id',
          {status: 422},
        );
      }

      externalId = extId;
    } else {
      // no location passed, use the env variable for the ecommerce location
      location = env.ECOM_LOCATION_ID;
    }
    // Fetch the qty from aptos if it exists, otherwise use the quantityAvailable from the storefront API
    // Return the Aptos Qty of the relevant location which is either ecom (no location passed in url params) or pos (location passed in url params)
    const aptosQuantity = await fetchAptosQty(sku, env, undefined, externalId);
    if (!aptosQuantity) {
      return new Response('No inventory data found', {status: 404});
    }

    //Get InventoryItem Id
    const {data: inventoryData} = await adminApiClient.request(
      SHOPIFY_ADMIN_INVENTORY_ITEM,
      {variables: {sku: `sku:${sku}`}},
    );
    if (!inventoryData) {
      return new Response('No matching Shopify inventory item found', {
        status: 500,
      });
    }
    const inventoryItemId = inventoryData?.inventoryItems?.edges[0]?.node?.id;
    const inventoryThresholdOverride =
      inventoryData?.inventoryItems?.edges[0]?.node?.variant
        ?.inventory_threshold_override?.value;

    if (!location || !inventoryItemId) {
      return new Response('No matching Shopify inventory/location item found', {
        status: 500,
      });
    }

    //Get the global threshold variable from env and use SKU-level override if it exists
    const globalThreshold: number = env.APTOS_QTY_THRESHOLD
      ? parseFloat(env.APTOS_QTY_THRESHOLD)
      : 0;
    const threshold = inventoryThresholdOverride
      ? parseFloat(inventoryThresholdOverride)
      : globalThreshold;
    const quantityAvailable = Math.max(
      0,
      aptosQuantity.aptosInventory - threshold,
    );

    const result = await adminApiClient.request(
      SHOPIFY_ADMIN_INVENTORY_SET_QUANTITIES,
      {
        variables: {
          input: {
            name: 'available',
            reason: 'correction',
            quantities: [
              {
                inventoryItemId,
                locationId: toLocationGid(location),
                quantity: quantityAvailable,
              },
            ],
            ignoreCompareQuantity: true,
          },
        },
      },
    );
    let reply;
    if (result.data?.inventorySetQuantities?.userErrors?.length > 0) {
      reply = {
        success: false,
        sku,
        aptosQuantity,
        threshold,
        quantityAvailable,
        message: result.data.inventorySetQuantities.userErrors[0].message,
      };
    } else {
      reply = {
        success: true,
        sku,
        aptosQuantity,
        threshold,
        quantityAvailable,
        message: 'Shopify inventory updated successfully',
      };
    }

    // Return success response with updated quantity
    return new Response(JSON.stringify(reply), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(error);
    return new Response('An error occurred while processing your request.', {
      status: 500,
    });
  }
}
