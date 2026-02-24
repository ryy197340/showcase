import {Product} from '@shopify/hydrogen/storefront-api-types';
import {redirect} from '@shopify/remix-oxygen';
import {AppLoadContext} from '@shopify/remix-oxygen';
import {XMLParser} from 'fast-xml-parser';

import {
  SHOPIFY_ADMIN_INVENTORY_ITEM,
  SHOPIFY_ADMIN_INVENTORY_SET_QUANTITIES,
} from '~/queries/shopify/inventory';
import {Locale} from '~/types/shopify';

import {returnLocalePrefixPath} from './global';

export const fetchAptosQty = async (
  sku?: string | null,
  env?: Env | Record<string, string>,
  context?: AppLoadContext,
  externalId?: string, // optional, use with POS
): Promise<{sku: string; aptosInventory: number} | undefined> => {
  // TODO: replace this with a "vanilla" Aptos request (reuse the one that currently exists in Gadget)
  if (!sku || !env) return undefined;

  try {
    //Get Aptos inventory data
    const apiUrl = `${
      env['APTOS_API_BASEURL']
    }/ProductService.asmx/GetInventoryByProductPartNoOrOptionValue?ClientName=${
      env['APTOS_CLIENT_NAME']
    }&Guid=${
      env['APTOS_API_GUID']
    }&AffiliateExternalID=9007&SupplierFullNames=${
      externalId && externalId !== '9007' ? externalId : 'ALL'
    }&PartnoOrOptionValueAndQty=${sku}%7C1&ProcessingOptions=SearchByUPC=false`;
    const response = await fetch(apiUrl).then((res) => res.text());
    const selectedVariantInfo = new XMLParser().parse(response);

    if (!selectedVariantInfo) {
      return undefined;
    }

    //Get quantity from Aptos response
    const aptosQuantity =
      selectedVariantInfo.ProductSuppliers?.ProductSupplier?.Products?.Product
        ?.ProductQTY;
    if (!Number.isInteger(aptosQuantity)) {
      throw "Can't find the ProductQTY data in Aptos";
    }

    if (context) {
      const aptosQuantityAvailable = await syncInventoryInShopify(
        aptosQuantity,
        sku,
        context,
      );
      return {sku, aptosInventory: aptosQuantityAvailable};
    } else {
      return {sku, aptosInventory: aptosQuantity};
    }
  } catch (error) {
    console.error('API request error:', error);
    return undefined; // Return undefined in case of error
  }
};

async function syncInventoryInShopify(
  aptosQuantity: number,
  sku: string,
  context: AppLoadContext,
) {
  const {env, adminApiClient, shopifyDefaultLocationId} = context;

  if (!adminApiClient) {
    throw new Error('Admin API client is not configured.');
  }

  //Get Location Id
  if (!shopifyDefaultLocationId) {
    throw new Error('No matching Shopify location found');
  }
  const locationId = shopifyDefaultLocationId;

  //Get InventoryItem Id
  const {data: inventoryData} = await adminApiClient.request(
    SHOPIFY_ADMIN_INVENTORY_ITEM,
    {variables: {sku: `sku:${sku}`}},
  );
  if (!inventoryData) {
    throw new Error('No matching Shopify inventory item found');
  }
  const inventoryItemId = inventoryData?.inventoryItems?.edges[0]?.node?.id;
  const inventoryThresholdOverride =
    inventoryData?.inventoryItems?.edges[0]?.node?.variant
      ?.inventory_threshold_override?.value;

  if (!locationId || !inventoryItemId) {
    throw new Error('No matching Shopify inventory/location item found');
  }

  const globalThreshold: number = env.APTOS_QTY_THRESHOLD
    ? parseFloat(env.APTOS_QTY_THRESHOLD)
    : 0;
  const threshold = inventoryThresholdOverride
    ? parseFloat(inventoryThresholdOverride)
    : globalThreshold;
  const quantityAvailable = Math.max(0, aptosQuantity - threshold);

  await adminApiClient.request(SHOPIFY_ADMIN_INVENTORY_SET_QUANTITIES, {
    variables: {
      input: {
        name: 'available',
        reason: 'correction',
        quantities: [
          {
            inventoryItemId,
            locationId,
            quantity: quantityAvailable,
          },
        ],
        ignoreCompareQuantity: true,
      },
    },
  });

  return quantityAvailable;
}

export function syncInventoryInShopifyBySku(sku: string) {
  return fetch(`/api/aptos/inventory/${sku}`);
}

export const fetchAptosQtyBulk = async (
  skus: Array<string | undefined>,
  env?: Env | Record<string, string>,
  context?: AppLoadContext,
): Promise<Array<{sku: string; aptosInventory: number}>> => {
  // TODO: replace this with a "vanilla" Aptos request (reuse the one that currently exists in Gadget)
  if (skus.length < 0 || !env) return [];

  try {
    const aptosFetchRequests: any[] = [];
    skus.forEach((sku) => {
      aptosFetchRequests.push(fetchAptosQty(sku, env));
    });
    const aptosInventories = (await Promise.all(aptosFetchRequests)) as Array<{
      sku: string;
      aptosInventory: number;
    }>;

    //Get quantity from Aptos response
    if (context) {
      const aptosQuantityAvailable = await syncInventoryInShopifyBulk(
        aptosInventories,
        skus,
        context,
      );
      return aptosQuantityAvailable;
    } else {
      return aptosInventories;
    }
  } catch (error) {
    console.error('API request error:', error);
    return []; // Return undefined in case of error
  }
};

async function syncInventoryInShopifyBulk(
  aptosInventories: Array<{sku: string; aptosInventory: number}>,
  skus: Array<string | undefined>,
  context: AppLoadContext,
) {
  const {env, adminApiClient, shopifyDefaultLocationId} = context;

  if (!adminApiClient) {
    throw new Error('Admin API client is not configured.');
  }

  //Get Location Id
  if (!shopifyDefaultLocationId) {
    throw new Error('No matching Shopify location found');
  }
  const locationId = shopifyDefaultLocationId;

  const query = skus
    .filter((item) => item)
    .map((sku) => `sku:${sku}`)
    .join(' OR ');
  //Get InventoryItem Id
  const {data: inventoryData} = await adminApiClient.request(
    SHOPIFY_ADMIN_INVENTORY_ITEM,
    {variables: {sku: query}},
  );
  if (!inventoryData) {
    throw new Error('No matching Shopify inventory items found');
  }

  const newAptosInventory = [] as Array<{sku: string; aptosInventory: number}>;
  const quantities = [] as Array<{
    inventoryItemId: string;
    locationId: string;
    quantity: number;
  }>;
  const globalThreshold: number = context.env.APTOS_QTY_THRESHOLD
    ? parseFloat(context.env.APTOS_QTY_THRESHOLD)
    : 0;
  inventoryData.inventoryItems.edges.forEach((edge: any) => {
    const inventoryThresholdOverride =
      edge.node?.variant?.inventory_threshold_override?.value;
    const threshold = inventoryThresholdOverride
      ? parseFloat(inventoryThresholdOverride)
      : globalThreshold;
    const sku = edge.node?.sku;
    const aptosQuantity = aptosInventories.find((item) => item?.sku == sku);
    if (aptosQuantity) {
      const quantityAvailable = Math.max(
        0,
        aptosQuantity.aptosInventory - threshold,
      );

      newAptosInventory.push({sku, aptosInventory: quantityAvailable});
      const result = {
        inventoryItemId: edge.node.id,
        locationId,
        quantity: quantityAvailable,
      };
      quantities.push(result);
    }
  });

  const {data: response} = await adminApiClient.request(
    SHOPIFY_ADMIN_INVENTORY_SET_QUANTITIES,
    {
      variables: {
        input: {
          name: 'available',
          reason: 'correction',
          quantities,
          ignoreCompareQuantity: true,
        },
      },
    },
  );

  if (!response) {
    throw new Error('Bulk Sync Inventory fails.');
  }
  return newAptosInventory;
}

export function convertRichTextToHtml(schema: any, scoped?: boolean) {
  if (!schema || schema === '') {
    return '';
  }

  if (typeof schema === 'string') {
    schema = JSON.parse(schema);
  }
  let html = ``;
  if (schema.type === 'root' && schema.children.length > 0) {
    if (scoped) {
      html += `
      <div class="${scoped === true ? `rte` : scoped}">
        ${convertRichTextToHtml(schema.children)}
      </div>
      `;
    } else {
      html += convertRichTextToHtml(schema.children);
    }
  } else {
    for (const el of schema) {
      switch (el.type) {
        case 'paragraph':
          html += buildParagraph(el);
          break;
        case 'heading':
          html += buildHeading(el);
          break;
        case 'list':
          html += buildList(el);
          break;
        case 'list-item':
          html += buildListItem(el);
          break;
        case 'link':
          html += buildLink(el);
          break;
        case 'text':
          html += buildText(el);
          break;
        default:
          break;
      }
    }
  }
  return html;
}

function buildParagraph(el: any) {
  if (el?.children) {
    return `<p>${convertRichTextToHtml(el?.children)}</p>`;
  }
}

function buildHeading(el: any) {
  if (el?.children) {
    return `<h${el?.level}>${convertRichTextToHtml(el?.children)}</h${
      el?.level
    }>`;
  }
}

function buildList(el: any) {
  if (el?.children) {
    if (el?.listType === 'ordered') {
      return `<ol>${convertRichTextToHtml(el?.children)}</ol>`;
    } else {
      return `<ul>${convertRichTextToHtml(el?.children)}</ul>`;
    }
  }
}

function buildListItem(el: any) {
  if (el?.children) {
    return `<li>${convertRichTextToHtml(el?.children)}</li>`;
  }
}

function buildLink(el: any) {
  return `<a href="${el?.url}" title="${el?.title}" class="underline" target="${
    el?.target
  }">${convertRichTextToHtml(el?.children)}</a>`;
}

function buildText(el: any) {
  if (el?.bold) {
    return `<strong>${el?.value}</strong>`;
  }
  if (el?.italic) {
    return `<em>${el?.value}</em>`;
  }
  if (el?.value === '') {
    return `<br />`;
  }
  return el?.value;
}

// loader
// TODO: This is not being used anywhere. Delete once we confirm it won't be needed in the future either.
export function redirectToFirstVariant({
  product,
  request,
  locale,
}: {
  product: Product;
  request: Request;
  locale: Locale;
}) {
  const searchParams = new URLSearchParams(new URL(request.url).search);
  const firstVariant = product!.variants.nodes[0];
  for (const option of firstVariant.selectedOptions) {
    searchParams.set(option.name, option.value);
  }
  throw redirect(
    `${
      locale.country === 'US' ? '' : returnLocalePrefixPath(locale)
    }/products/${product!.handle}?${searchParams.toString()}`,
    302,
  );
}

export function generateCioFamilyTag(tags: string[]): {
  familyTag: string;
  cioFamilyTag: string;
} {
  let familyTag = '';
  let cioFamilyTag = '';

  if (tags && tags.length > 0) {
    const foundTag = tags.find((currentTag) =>
      currentTag.startsWith('Family: '),
    );

    if (foundTag) {
      familyTag = 'tag:' + foundTag;
      cioFamilyTag =
        foundTag.replace('Family: ', '').replaceAll(' ', '-').toLowerCase() +
        '-parent';
    }
  }

  return {familyTag, cioFamilyTag};
}
