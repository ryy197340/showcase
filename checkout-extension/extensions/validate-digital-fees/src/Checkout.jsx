import {
  reactExtension,
  useApi,
  useApplyCartLinesChange,
  useCartLines,
  useInstructions,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useRef } from "react";

// 1. Choose an extension target
export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

const DIGITAL_NAMESPACE = "cm_digital";
const DIGITAL_KEY = "is_digital";
const DEFAULT_FEE_PRODUCT_HANDLE = "digital-delivery-fee";
const PUBLISHER_NAMESPACE = "course_materials";
const PUBLISHER_KEY = "publisher_code";
const REQUIRES_DIGITAL_DELIVERY_FEE_ATTR = "_requires_digital_delivery_fee";
const REQUIRES_FEE_YES = "yes";
const REQUIRES_FEE_NO = "no";
const DEFAULT_API_URL = "https://retail-media-solutions.shopify-integrations.follett.com/api/digitalfeevalidation";
const LOG_PREFIX = "[validate-digital-fees]";

function Extension() {
  const { query } = useApi();
  const instructions = useInstructions();
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();
  const settings = useSettings();
  const syncingRef = useRef(false);
  const feeVariantIdRef = useRef(null);

  /**
   * Gets the store number from shop metafields (store_id), settings, or window fallback
   * This matches the repo implementation which uses shop.metafields.custom.store_id
   */
  const getStoreNumber = async () => {
    // Priority 1: Extension settings (optional override)
    if (settings?.store_number) {
      return settings.store_number;
    }

    // Priority 2: Shop metafield (store_id) - THIS IS WHAT THE REPO USES
    try {
      const shopResponse = await query(`
        query {
          shop {
            storeId: metafield(namespace: "custom", key: "store_id") {
              value
            }
          }
        }
      `);

      const shopData = /** @type {{ shop?: { storeId?: { value?: string } } } | undefined } */ (shopResponse?.data);
      const storeId = shopData?.shop?.storeId?.value;
      if (storeId) {
        return storeId;
      }
    } catch (error) {
      // Could not query shop metafield
    }

    // Priority 3: Window object fallback
    if (typeof window !== "undefined") {
      try {
        const config = /** @type {{ store_number?: string } } */ (window["digital_product_config"]);
        if (config?.store_number) {
          return config.store_number;
        }
      } catch (error) {
        // Ignore
      }
    }

    return "";
  };

  /**
   * Checks if a publisher requires a digital delivery fee by querying the external API.
   * Performs all required checks as per documentation:
   * 1. Publisher code exists
   * 2. API configuration (api_url and store_number) exists
   * 3. API request succeeds
   * 4. API response is valid (result.length > 0)
   * 5. Fee is applied (result[0].isApplied === true)
   *
   * NOTE: API URL is provided via extension settings, store_number is fetched dynamically.
   */
  const shouldApplyFeeForPublisher = async (publisherCode, extensionSettings) => {
    // Check 1: Publisher code must exist
    if (!publisherCode || publisherCode.trim() === "") {
      console.log(LOG_PREFIX, "API: publisherCode missing or empty, skipping");
      return { requiresFee: false };
    }

    // Check 2 & 3: API configuration must exist
    let api_url = extensionSettings?.api_url ?? "";

    if (!api_url && typeof window !== "undefined") {
      try {
        const config = /** @type {{ api_url?: string } } */ (window["digital_product_config"]);
        if (config?.api_url) {
          api_url = config.api_url;
        }
      } catch (error) {
        // Could not access window.digital_product_config
      }
    }

    if (!api_url) {
      api_url = DEFAULT_API_URL;
    }

    const store_number = await getStoreNumber();

    console.log(LOG_PREFIX, "API request params:", {
      publisherCode,
      store_number,
      api_url,
      api_url_from_settings: !!extensionSettings?.api_url,
    });

    if (api_url && store_number) {
      try {
        const apiUrl = `${api_url}?storeNumber=${store_number}&downloadprovidercode=${publisherCode}`;
        console.log(LOG_PREFIX, "API URL (full):", apiUrl);
        const apiResponse = await fetch(apiUrl);
        const result = await apiResponse.json();
        console.log(LOG_PREFIX, "API response:", {
          status: apiResponse.status,
          ok: apiResponse.ok,
          result,
          resultLength: Array.isArray(result) ? result.length : "n/a",
          isApplied: result?.[0]?.isApplied,
        });

        // 4xx: make no cart changes (do not update attributes or add/remove fee lines)
        const status = apiResponse.status;
        const is4xx = status >= 400 && status <= 499;
        if (is4xx) {
          const apiError = result?.error ?? `HTTP ${status}`;
          console.warn(
            LOG_PREFIX,
            "API 4xx:",
            apiError,
            "— making no changes. Request was storeNumber=" + store_number + " downloadprovidercode=" + publisherCode
          );
          return { requiresFee: false, skipDueTo4xx: true };
        }

        // Expected success: 200 with JSON array like [{ isApplied: true }]
        if (!apiResponse.ok || (result && typeof result === "object" && "error" in result)) {
          const apiError = result?.error ?? `HTTP ${apiResponse.status}`;
          console.warn(
            LOG_PREFIX,
            "API error:",
            apiError,
            "— fee will not be applied. Request was storeNumber=" + store_number + " downloadprovidercode=" + publisherCode + ". Fix: configure this store + publisher on the digital fee validation API."
          );
        } else if (!Array.isArray(result) || result.length === 0) {
          console.log(LOG_PREFIX, "API returned empty or non-array result, fee not applied");
        }

        if (result && result.length > 0 && result[0].isApplied) {
          return { requiresFee: true };
        } else {
          return { requiresFee: false };
        }
      } catch (error) {
        console.log(LOG_PREFIX, "API request error:", error);
        return { requiresFee: false };
      }
    } else {
      console.log(LOG_PREFIX, "API skipped: missing api_url or store_number", { api_url: !!api_url, store_number: store_number || "(empty)" });
      return { requiresFee: false };
    }
  };

  /**
   * Gets the publisher code from product metafields (secure - cannot be tampered with).
   * Location: product.metafields.course_materials.publisher_code.value
   */
  const getPublisherCode = (line, variantInfo) => {
    const info = variantInfo.get(line.merchandise.id);

    if (info?.product?.publisherCode?.value) {
      return info.product.publisherCode.value;
    }

    return null;
  };

  /**
   * Returns true if the cart line has _requires_digital_delivery_fee set to yes (or legacy true).
   */
  const hasRequiresDigitalDeliveryFeeYes = (line) => {
    const v = line.attributes?.find(
      (attr) => attr?.key === REQUIRES_DIGITAL_DELIVERY_FEE_ATTR
    )?.value;
    const normalized = `${v ?? ""}`.trim().toLowerCase();
    return normalized === "yes" || normalized === "true";
  };

  // Hooks must be called unconditionally (Rules of Hooks). Do not return before useEffect.
  useEffect(() => {
    // No cart line permissions = nothing to do; bail without running sync
    if (
      !instructions.lines.canAddCartLine &&
      !instructions.lines.canUpdateCartLine &&
      !instructions.lines.canRemoveCartLine
    ) {
      return;
    }
    if (cartLines.length === 0) {
      console.log(LOG_PREFIX, "sync skipped: empty cart");
      return;
    }

    async function syncDigitalFees() {
      if (syncingRef.current) {
        console.log(LOG_PREFIX, "sync skipped: already syncing");
        return;
      }
      syncingRef.current = true;
      console.log(LOG_PREFIX, "sync start, cart lines:", cartLines.length);

      try {
        const variantIds = cartLines.map((line) => line.merchandise.id);
        console.log(LOG_PREFIX, "fetching variant metafields for", variantIds.length, "variants");

        let data;
        let errors;
        try {
          const response = await query(
            `query CartLineVariants($ids: [ID!]!) {
              nodes(ids: $ids) {
                ... on ProductVariant {
                  id
                  product { 
                    handle
                    publisherCode: metafield(namespace: "${PUBLISHER_NAMESPACE}", key: "${PUBLISHER_KEY}") {
                      value
                    }
                  }
                  isDigital: metafield(namespace: "${DIGITAL_NAMESPACE}", key: "${DIGITAL_KEY}") {
                    value
                  }
                  department: metafield(namespace: "${DIGITAL_NAMESPACE}", key: "department") {
                    value
                  }
                  subDepartment: metafield(namespace: "${DIGITAL_NAMESPACE}", key: "sub_department") {
                    value
                  }
                  classValue: metafield(namespace: "${DIGITAL_NAMESPACE}", key: "class") {
                    value
                  }
                  subClass: metafield(namespace: "${DIGITAL_NAMESPACE}", key: "sub_class") {
                    value
                  }
                }
              }
            }`,
            { variables: { ids: variantIds } }
          );
          data = response?.data;
          errors = response?.errors;
        } catch (error) {
          console.log(LOG_PREFIX, "variant query failed", error);
          return;
        }

        if (errors?.length) {
          console.log(LOG_PREFIX, "variant query errors", errors);
          return;
        }

        const responseData = /** @type {{ nodes?: Array<{ id?: string }> } } */ (data);
        const nodes = responseData?.nodes ?? [];
        console.log(LOG_PREFIX, "variant data loaded, nodes:", nodes.length);

        const variantInfo = new Map();
        for (const node of nodes) {
          if (node?.id) {
            variantInfo.set(node.id, node);
          }
        }

        // Log metafields received for each variant
        const nodeShape = /** @type {Array<{ id?: string; product?: { handle?: string; publisherCode?: { value?: string } }; isDigital?: { value?: string }; department?: { value?: string }; subDepartment?: { value?: string }; classValue?: { value?: string }; subClass?: { value?: string } }>} */ (nodes);
        for (const node of nodeShape) {
          if (!node?.id) continue;
          const product = node.product ?? {};
          const publisherCode = product?.publisherCode?.value ?? null;
          const isDigital = (node.isDigital?.value ?? "").trim().toLowerCase() === "true";
          console.log(LOG_PREFIX, "variant metafields:", {
            variantId: node.id,
            productHandle: product?.handle,
            publisherCode,
            isDigital,
            department: node.department?.value ?? null,
            subDepartment: node.subDepartment?.value ?? null,
            class: node.classValue?.value ?? null,
            subClass: node.subClass?.value ?? null,
          });
        }

        let applicableDigitalQuantity = 0;
        let feeQuantity = 0;
        const feeLines = [];
        let digitalMetafields = null;
        const digitalItemsToValidate = [];

        // First pass: Identify fee lines and digital items
        for (const line of cartLines) {
          const isFeeLine = line.attributes?.some(
            (attribute) =>
              attribute?.key === "_digital_delivery_fee" &&
              `${attribute?.value ?? ""}`.trim().toLowerCase() === "true"
          );

          if (isFeeLine) {
            feeQuantity += line.quantity;
            feeLines.push(line);
            continue;
          }

          const info = variantInfo.get(line.merchandise.id);

          const isDigital =
            (info?.isDigital?.value ?? "")
              .trim()
              .toLowerCase() === "true";

          if (!isDigital) {
            continue;
          }

          const publisherFromInfo = info?.product?.publisherCode?.value ?? null;
          console.log(LOG_PREFIX, "digital item to validate:", {
            lineId: line.id,
            merchandiseId: line.merchandise?.id,
            title: line.merchandise?.title,
            quantity: line.quantity,
            publisherCode: publisherFromInfo,
          });
          digitalItemsToValidate.push({ line, info });
        }

        console.log(LOG_PREFIX, "first pass: fee lines", feeLines.length, "feeQuantity", feeQuantity, "| digital items to validate", digitalItemsToValidate.length);

        // Second pass: Re-validate ALL digital items via full check sequence
        const validationPromises = digitalItemsToValidate.map(
          async ({ line, info }) => {
            const publisherCode = getPublisherCode(line, variantInfo);

            if (!publisherCode || publisherCode.trim() === "") {
              return { line, info, requiresFee: false, reason: "no_publisher_code" };
            }

            const apiResult = await shouldApplyFeeForPublisher(
              publisherCode,
              settings
            );
            const requiresFee = apiResult?.requiresFee ?? false;
            const skipDueTo4xx = apiResult?.skipDueTo4xx ?? false;
            return { line, info, requiresFee, skipDueTo4xx, publisherCode };
          }
        );

        const validationResults = await Promise.all(validationPromises);

        const any4xx = validationResults.some((r) => r.skipDueTo4xx);
        if (any4xx) {
          console.log(LOG_PREFIX, "API returned 4xx for at least one item — making no cart changes");
          return;
        }

        for (const result of validationResults) {
          const title = result.line?.merchandise?.title ?? result.line?.merchandise?.id;
          const reason = result.reason;
          console.log(LOG_PREFIX, "validation:", title, "| publisher:", result.publisherCode ?? "—", "| requiresFee:", result.requiresFee, reason ? "| reason: " + reason : "");
        }

        for (const result of validationResults) {
          const { line, requiresFee } = result;
          if (requiresFee) {
            applicableDigitalQuantity += line.quantity;
            if (!digitalMetafields) {
              digitalMetafields = result.info ?? null;
            }
          }
        }

        console.log(LOG_PREFIX, "applicableDigitalQuantity", applicableDigitalQuantity, "feeQuantity", feeQuantity);

        // Ensure _requires_digital_delivery_fee is "yes" or "no" per configuration.
        const linesNeedingFeeYes = validationResults.filter(
          (r) => r.requiresFee && !hasRequiresDigitalDeliveryFeeYes(r.line)
        );
        const linesNeedingFeeNo = validationResults.filter(
          (r) => !r.requiresFee && hasRequiresDigitalDeliveryFeeYes(r.line)
        );
        console.log(LOG_PREFIX, "property updates: set to yes", linesNeedingFeeYes.length, "| set to no", linesNeedingFeeNo.length);

        if (instructions.lines.canUpdateCartLine) {
          for (const { line } of linesNeedingFeeYes) {
            console.log(LOG_PREFIX, "updateCartLine: set _requires_digital_delivery_fee=yes", line.merchandise?.title ?? line.id);
            const existingAttrs = line.attributes ?? [];
            const attrsWithoutFee = existingAttrs.filter(
              (a) => a?.key !== REQUIRES_DIGITAL_DELIVERY_FEE_ATTR
            );
            await applyCartLinesChange({
              type: "updateCartLine",
              id: line.id,
              attributes: [
                ...attrsWithoutFee,
                {
                  key: REQUIRES_DIGITAL_DELIVERY_FEE_ATTR,
                  value: REQUIRES_FEE_YES,
                },
              ],
            });
          }
          for (const { line } of linesNeedingFeeNo) {
            console.log(LOG_PREFIX, "updateCartLine: set _requires_digital_delivery_fee=no", line.merchandise?.title ?? line.id);
            const existingAttrs = line.attributes ?? [];
            const attrsWithoutFee = existingAttrs.filter(
              (a) => a?.key !== REQUIRES_DIGITAL_DELIVERY_FEE_ATTR
            );
            await applyCartLinesChange({
              type: "updateCartLine",
              id: line.id,
              attributes: [
                ...attrsWithoutFee,
                {
                  key: REQUIRES_DIGITAL_DELIVERY_FEE_ATTR,
                  value: REQUIRES_FEE_NO,
                },
              ],
            });
          }
        }

        // Ensure all digital fee lines have _is_digital="true" attribute.
        if (instructions.lines.canUpdateCartLine && feeLines.length > 0) {
          for (const feeLine of feeLines) {
            const hasIsDigitalTrue =
              feeLine.attributes?.some(
                (attr) =>
                  attr?.key === "_is_digital" &&
                  `${attr?.value ?? ""}`.trim().toLowerCase() === "true"
              ) ?? false;

            if (!hasIsDigitalTrue) {
              console.log(
                LOG_PREFIX,
                'updateCartLine: set _is_digital="true" on fee line',
                feeLine.merchandise?.title ?? feeLine.id
              );
              const existingAttrs = feeLine.attributes ?? [];
              const attrsWithoutIsDigital = existingAttrs.filter(
                (a) => a?.key !== "_is_digital"
              );
              await applyCartLinesChange({
                type: "updateCartLine",
                id: feeLine.id,
                attributes: [
                  ...attrsWithoutIsDigital,
                  { key: "_is_digital", value: "true" },
                ],
              });
            }
          }
        }

        if (applicableDigitalQuantity === feeQuantity) {
          console.log(LOG_PREFIX, "fee already in sync, no change");
          return;
        }

        if (applicableDigitalQuantity === 0) {
          if (!instructions.lines.canRemoveCartLine) {
            console.log(LOG_PREFIX, "no digital fee needed but cannot remove fee line");
            return;
          }
          console.log(LOG_PREFIX, "removing fee line(s), count:", feeLines.length);
          for (const feeLine of feeLines) {
            await applyCartLinesChange({
              type: "removeCartLine",
              id: feeLine.id,
              quantity: feeLine.quantity,
            });
          }

          return;
        }

        let feeVariantId = feeVariantIdRef.current;
        if (!feeVariantId) {
          const feeLine = cartLines.find((line) =>
            line.attributes?.some(
              (attribute) =>
                attribute?.key === "_digital_delivery_fee" &&
                `${attribute?.value ?? ""}`.trim().toLowerCase() === "true"
            )
          );
          feeVariantId = feeLine?.merchandise?.id ?? null;
          feeVariantIdRef.current = feeVariantId;
        }

        // Prefer variant from settings (product/variant picker); fallback to handle lookup
        if (!feeVariantId && settings?.fee_variant) {
          feeVariantId = settings.fee_variant;
          feeVariantIdRef.current = feeVariantId;
          console.log(LOG_PREFIX, "fee variant from settings (picker):", feeVariantId);
        }

        if (!feeVariantId) {
          const feeProductHandle = DEFAULT_FEE_PRODUCT_HANDLE;
          console.log(LOG_PREFIX, "looking up fee product handle (fallback):", feeProductHandle);
          try {
            const feeResponse = await query(
              `query FeeProduct($handle: String!) {
                product(handle: $handle) {
                  variants(first: 1) {
                    nodes { id }
                  }
                }
              }`,
              { variables: { handle: feeProductHandle } }
            );
            const feeData = /** @type {{ product?: { variants?: { nodes?: Array<{ id?: string }> } } } } */ (feeResponse?.data);
            feeVariantId = feeData?.product?.variants?.nodes?.[0]?.id ?? null;
            feeVariantIdRef.current = feeVariantId;
            console.log(LOG_PREFIX, "fee variant id:", feeVariantId ?? "not found");
          } catch (error) {
            console.log(LOG_PREFIX, "fee product query failed", error);
          }
        }

        if (feeLines.length === 0) {
          if (!instructions.lines.canAddCartLine) {
            console.log(LOG_PREFIX, "need to add fee but canAddCartLine is false");
            return;
          }

          if (!feeVariantId) {
            console.log(LOG_PREFIX, "cannot add fee: fee variant not found");
            return;
          }

          console.log(LOG_PREFIX, "addCartLine: digital fee, quantity", applicableDigitalQuantity);
          const attributes = [
            { key: "_digital_delivery_fee", value: "true" },
            { key: "_fee_type", value: "online_store" },
            { key: "_is_digital", value: "true" }
          ];

          const department = digitalMetafields?.department?.value ?? null;
          const subDepartment =
            digitalMetafields?.subDepartment?.value ?? null;
          const classValue = digitalMetafields?.classValue?.value ?? null;
          const subClass = digitalMetafields?.subClass?.value ?? null;

          if (department) {
            attributes.push({ key: "_department", value: department });
          }
          if (subDepartment) {
            attributes.push({ key: "_sub_department", value: subDepartment });
          }
          if (classValue) {
            attributes.push({ key: "_class", value: classValue });
          }
          if (subClass) {
            attributes.push({ key: "_sub_class", value: subClass });
          }

          await applyCartLinesChange({
            type: "addCartLine",
            merchandiseId: feeVariantId,
            quantity: applicableDigitalQuantity,
            attributes,
          });
          console.log(LOG_PREFIX, "addCartLine done");

          return;
        }

        if (!instructions.lines.canUpdateCartLine) {
          console.log(LOG_PREFIX, "need to update fee quantity but canUpdateCartLine is false");
          return;
        }

        console.log(LOG_PREFIX, "updateCartLine: fee line quantity to", applicableDigitalQuantity);
        await applyCartLinesChange({
          type: "updateCartLine",
          id: feeLines[0].id,
          quantity: applicableDigitalQuantity,
        });

        if (feeLines.length > 1 && instructions.lines.canRemoveCartLine) {
          console.log(LOG_PREFIX, "removing extra fee lines:", feeLines.length - 1);
          for (const extraLine of feeLines.slice(1)) {
            await applyCartLinesChange({
              type: "removeCartLine",
              id: extraLine.id,
              quantity: extraLine.quantity,
            });
          }
        }

        console.log(LOG_PREFIX, "sync complete");
      } catch (err) {
        console.log(LOG_PREFIX, "sync error", err);
      } finally {
        syncingRef.current = false;
      }
    }

    syncDigitalFees();
  }, [applyCartLinesChange, cartLines, instructions, query, settings]);

  return null;
}
