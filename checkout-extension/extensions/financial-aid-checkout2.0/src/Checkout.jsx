import {
  reactExtension,
  BlockStack,
  Checkbox,
  Text,
  Heading,
  Link,
  TextField,
  Button,
  InlineLayout,
  Image,
  Divider,
  Pressable,
  Icon,
  Tooltip,
  Grid,
  Style,
  View,
  GridItem,
  useShop,
  useCustomer,
  useTotalAmount,
  useCartLines,
  useCheckoutToken,
  useApplyGiftCardChange,
  useAppliedGiftCards,
  Modal,
  useApi,
  useAppMetafields,
  useTotalShippingAmount,
  useShippingAddress,
  useBillingAddress,
  useDiscountCodes,
  useAttributes,
  useEmail,
  useSettings,
  useTotalTaxAmount,
  useApplyAttributeChange,
  useInstructions
} from "@shopify/ui-extensions-react/checkout";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function useShopMetafieldValue(namespace, key) {
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const QUERY = `
      query ShopMF($ns: String!, $key: String!) {
        shop { metafield(namespace: $ns, key: $key) { value } }
      }
    `;
    (async () => {
      try {
        const res = await fetch("shopify:storefront/api/graphql.json", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            query: QUERY,
            variables: { ns: namespace, key },
          }),
        });
        const { data, errors } = await res.json();
        if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
        setValue(data?.shop?.metafield?.value ?? null);
      } catch (e) {
        setError(String(e));
        setValue(null);
      }
    })();
  }, [namespace, key]);

  return { value, error };
}

function useProductTaxonomyFromStorefront(productIds, variantIds) {
  const uniqProductIds = useMemo(
    () => Array.from(new Set((productIds || []).filter(Boolean))),
    [productIds]
  );
  
  const uniqVariantIds = useMemo(
    () => Array.from(new Set((variantIds || []).filter(Boolean))),
    [variantIds]
  );
  
  const [byProduct, setByProduct] = useState(new Map());
  const [byVariant, setByVariant] = useState(new Map());

  useEffect(() => {
    if (!uniqProductIds.length && !uniqVariantIds.length) {
      setByProduct(new Map());
      setByVariant(new Map());
      return;
    }

    const QUERY = `
      query ProductAndVariantTaxonomy($productIds: [ID!]!, $variantIds: [ID!]!) {
        products: nodes(ids: $productIds) {
          ... on Product {
            id
            department: metafield(namespace: "taxonomy", key: "department") { value }
            sub_department: metafield(namespace: "taxonomy", key: "sub_department") { value }
            class: metafield(namespace: "taxonomy", key: "class") { value }
            sub_class: metafield(namespace: "taxonomy", key: "sub_class") { value }
          }
        }
        variants: nodes(ids: $variantIds) {
          ... on ProductVariant {
            id
            department: metafield(namespace: "taxonomy", key: "department") { value }
            sub_department: metafield(namespace: "taxonomy", key: "sub_department") { value }
            class: metafield(namespace: "taxonomy", key: "class") { value }
            sub_class: metafield(namespace: "taxonomy", key: "sub_class") { value }
          }
        }
      }
    `;

    (async () => {
      try {
        const res = await fetch("shopify:storefront/api/graphql.json", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ 
            query: QUERY, 
            variables: { 
              productIds: uniqProductIds.length > 0 ? uniqProductIds : ["gid://shopify/Product/0"],
              variantIds: uniqVariantIds.length > 0 ? uniqVariantIds : ["gid://shopify/ProductVariant/0"]
            } 
          }),
        });
        const { data, errors } = await res.json();
        if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));

        const productMap = new Map();
        for (const node of data?.products || []) {
          if (!node?.id) continue;
          productMap.set(node.id, {
            department: node?.department?.value ?? "",
            sub_department: node?.sub_department?.value ?? "",
            class: node?.class?.value ?? "",
            sub_class: node?.sub_class?.value ?? "",
          });
        }
        
        // Map para variantes
        const variantMap = new Map();
        for (const node of data?.variants || []) {
          if (!node?.id) continue;
          variantMap.set(node.id, {
            department: node?.department?.value ?? "",
            sub_department: node?.sub_department?.value ?? "",
            class: node?.class?.value ?? "",
            sub_class: node?.sub_class?.value ?? "",
          });
        }
        
        setByProduct(productMap);
        setByVariant(variantMap);
      } catch {
        setByProduct(new Map());
        setByVariant(new Map());
      }
    })();
  }, [uniqProductIds, uniqVariantIds]);

  return { byProduct, byVariant };
}

function useApiPost(getToken) {
  const post = useCallback(async (url, payload) => {
    const token = await getToken();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Shopify-Session-Token": token,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return text ? JSON.parse(text) : {};
  }, [getToken]);
  return { post };
}

async function verifyGiftCardsFetch(getToken, payload, financialAidURL) {
  const token = await getToken();
  const res = await fetch(
    `${financialAidURL}/api/financial-aid/verify-giftcards`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Shopify-Session-Token": token,
      },
      body: JSON.stringify(payload),
    }
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function studentIdLookupFetch(getToken, payload, signal = null, financialAidURL) {
  const token = await getToken();
  const res = await fetch(
    `${financialAidURL}/api/financial-aid/studentid-lookup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Shopify-Session-Token": token,
      },
      body: JSON.stringify(payload),
      signal: signal, // AbortController signal for request cancellation
    }
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function campusCardValidateFetch(getToken, payload, financialAidURL) {
  const token = await getToken();
  const res = await fetch(
    `${financialAidURL}/api/v1/campus-cards/validate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Shopify-Session-Token": token,
      },
      body: JSON.stringify(payload),
    }
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function campusCardRedeemFetch(getToken, payload, financialAidURL) {
  const token = await getToken();
  const res = await fetch(
    `${financialAidURL}/api/v1/campus-cards/redeem`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Shopify-Session-Token": token,
      },
      body: JSON.stringify(payload),
    }
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function generateGiftCardFetch(post, payload, financialAidURL) {
  return post(
    `${financialAidURL}/api/financial-aid/giftcard`,
    payload
  );
}

function buildAddress(addr) {
  const firstName = String(addr?.firstName ?? "");
  const lastName = String(addr?.lastName ?? "");
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  const phone     = String(addr?.phone ?? addr?.phoneNumber ?? "");

  return {
    address1: String(addr?.address1 ?? ""),
    city: String(addr?.city ?? ""),
    provinceCode: String(addr?.provinceCode ?? addr?.province ?? ""),
    countryCode: String(addr?.countryCode ?? addr?.country ?? ""),
    zip: String(addr?.postalCode ?? addr?.zip ?? ""),
    firstName,
    lastName,
    name,
    phone
  };
}

/**
 * Builds shipping address with fallback to billing address for firstName/lastName and address
 * when shipping address doesn't have name information (e.g., for Pickup orders).
 * This ensures Anatta eligibility checks can use name and address information from billing
 * when shipping address is not populated.
 * For Pickup orders, billing address name and address are used for shipping_address.
 */
function buildShippingAddressWithBillingFallback(shippingAddr, billingAddr) {
  const shipping = buildAddress(shippingAddr || {});
  const billing = buildAddress(billingAddr || {});
  
  // If shipping address doesn't have firstName/lastName, use billing address name and address
  const hasShippingName = shipping.firstName || shipping.lastName;
  
  if (!hasShippingName && (billing.firstName || billing.lastName)) {
    // Use billing address name and address fields when shipping is empty (Pickup orders)
    return {
      address1: billing.address1 || shipping.address1,
      city: billing.city || shipping.city,
      provinceCode: billing.provinceCode || shipping.provinceCode,
      countryCode: billing.countryCode || shipping.countryCode,
      zip: billing.zip || shipping.zip,
      firstName: billing.firstName,
      lastName: billing.lastName,
      name: billing.name || [billing.firstName, billing.lastName].filter(Boolean).join(" ").trim(),
      phone: billing.phone || shipping.phone
    };
  }
  
  return shipping;
}

function buildItemsForVerify(itemsArr) {
  return (itemsArr || []).map((it) => ({
    sku: it.sku,
    quantity: it.quantity,
    title: it.title,
    total_price: it.total_price,
    department: it.department,
    sub_department: it.sub_department,
    class: it.class,
    sub_class: it.sub_class,
  }));
}

function buildAppliedGiftcardsPayload(appliedGiftCards) {
  return (appliedGiftCards || []).map((g) => {
    const used =
      Number(g?.amountUsedV2?.amount) ??
      Number(g?.amountUsed?.amount) ??
      Number(g?.balanceUsedV2?.amount) ??
      Number(g?.balanceUsed?.amount) ??
      0;

    const currency =
      String(g?.amountUsedV2?.currencyCode ||
             g?.amountUsed?.currencyCode ||
             g?.balanceUsedV2?.currencyCode ||
             g?.balanceUsed?.currencyCode ||
             "USD");

    return {
      last4: String(g?.lastCharacters ?? ""),
      amountUsed: {
        amount: Number.isFinite(used) ? used : 0,
        currencyCode: currency,
      },
    };
  });
}

function addressIsSufficient(addr, requireLastName = false, requirePhone = false) {
  if (!addr) return false;
  const a = buildAddress(addr);
  const hasCountry   = !!a.countryCode;
  const hasProvince  = !!a.provinceCode;
  const hasZip       = !!a.zip;
  const hasLastName  = !!a.lastName;
  const hasPhone     = !!a.phone;

  let ok = hasCountry && hasProvince && hasZip;
  if (requireLastName) ok = ok && hasLastName;
  if (requirePhone)    ok = ok && hasPhone;
  return ok;
}

const GRACE_MS = 4000;
function nowMs() { return Date.now(); }

function Extension() {
  const api = useApi();
  const { ui } = api;
  const getSessionToken = useCallback(() => api.sessionToken.get(), [api]);

  const settings = useSettings();
  const financialAidURL = useMemo(() => {
    const url = settings?.financial_aid_url;
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.error('[CONFIG] financial_aid_url not found!');
      return null;
    }
    return url.trim();
  }, [settings?.financial_aid_url]);

  const studentIdLabel = settings.student_id_label || "Student ID"
  const studentFieldHelperText = settings.student_id_helper_text || ""

  const applyAttributeChange = useApplyAttributeChange();
  const instructions = useInstructions(); 

  const attributes = useAttributes();
  const checkoutOrigin = attributes.find(attr => attr.key === 'CheckoutOrigin')?.value
  const isQrCodeEntry = checkoutOrigin === 'qr_code'
  if (isQrCodeEntry) {
    return null;
  }

  async function removeAllAppliedGiftCards() {
    const codes = (appliedGiftCards || [])
      .map(g => String(g?.code ?? g?.lastCharacters ?? '').trim())
      .filter(Boolean);

    for (const code of codes) {
      if (!code) continue;
      try {
        await applyGiftCardChange({ type: 'removeGiftCard', code });
      } catch { /* ignore */ }
    }
  }


  const handleSelectManager = useCallback(() => {
    setSelected("manager");
    setLastResponse(null);
    setAmountByFA({});
    setAppliedByFA({});
    setLastError(null);
  }, []);

  const clipboard_pen =
    "https://cdn.shopify.com/s/files/1/0721/0405/0878/files/clipboard-pen.svg?v=1757912918";
  const circle_check_filled =
    "https://cdn.shopify.com/s/files/1/0721/0405/0878/files/circle-check-filled.svg?v=1757912992";

  const [faVisible, setFaVisible] = useState(false);
  const [ccVisible, setCcVisible] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [selected, setSelected] = useState("student");

  const [amountByFA, setAmountByFA] = useState({});
  const [appliedByFA, setAppliedByFA] = useState({});

  const [restrictionsOpen, setRestrictionsOpen] = useState(false);
  const [restrictionLines, setRestrictionLines] = useState([]);

  const [loadingByFA, setLoadingByFA] = useState({});
  const [errorByFA, setErrorByFA] = useState({});

  const [ccCardNo, setCcCardNo] = useState("");
  const [ccPin, setCcPin] = useState("");
  const [ccLoading, setCcLoading] = useState(false);
  const [ccError, setCcError] = useState(null);
  const [ccBalance, setCcBalance] = useState(null);
  const [ccRedeemToken, setCcRedeemToken] = useState(null);
  const [ccAmount, setCcAmount] = useState("");
  const [ccApplied, setCcApplied] = useState(null);
  const [ccRedeemLoading, setCcRedeemLoading] = useState(false);
  const [ccRedeemError, setCcRedeemError] = useState(null);


  const customer = useCustomer();
  const shop = useShop();
  const totalAmount = useTotalAmount();
  const totalShippingAmount = useTotalShippingAmount();
  const cartLines = useCartLines();
  const checkoutToken = useCheckoutToken();
  const applyGiftCardChange = useApplyGiftCardChange();
  const appliedGiftCards = useAppliedGiftCards();
  const appliedGiftCardsRef = useRef([]);
  useEffect(() => { 
    appliedGiftCardsRef.current = appliedGiftCards || []; 
  }, [appliedGiftCards]);
  const shippingAddressHook = useShippingAddress();
  const billingAddressHook = useBillingAddress();
  const discountCodesHook = useDiscountCodes();

  const buyerEmail = (useEmail() || "").trim();
  const effectiveEmail = (customer?.email || buyerEmail).trim();

  const isStudent = selected === "student";
  const isManager = selected === "manager";
  const sso = false;

  const pendingBackendRemovalsRef = useRef(new Set());

  const suppressVerifyUntilTsRef = useRef(0);

  const recentlyAddedTsByCodeRef = useRef(new Map());

  const prevAppliedLast4Ref = useRef(new Set());

  const lastLookupTotalRef = useRef(null);
  const lastSentAmountRef = useRef(null); // tracks the amount/total_amount sent in last studentid-lookup

  const hasRunInitialVerifyRef = useRef(false);

  const hasRestoredForLookupRef = useRef(null);

  // Request cancellation and debouncing refs for rental eligibility checks
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const minLoadingTimeRef = useRef(null);
  const loadingStartTimeRef = useRef(null);

  const deliveryGroups = api.deliveryGroups.current;
  const hasPickup = useMemo(() => {
    if (!deliveryGroups) return false;
    
    const groups = Array.isArray(deliveryGroups) ? deliveryGroups : [deliveryGroups];
    
    return groups.some(group => {
      const options = group?.deliveryOptions || group?.selectedDeliveryOption;
      if (!options) return false;
      
      const optionsArray = Array.isArray(options) ? options : [options];
      return optionsArray.some(option => 
        option?.type === 'pickup' || option?.handle?.includes('pickup')
      );
    });
  }, [deliveryGroups]);

  useEffect(() => {
    setCcRedeemToken(null);
  }, [ccCardNo, ccPin, checkoutToken]);

    function giftCardsKey(list) {
      return (list || [])
        .map((g) => String(g?.code ?? g?.lastCharacters ?? ''))
        .filter(Boolean)
        .sort()
        .join('|');
    }
    const prevGiftCardsKeyRef = useRef('');
    useEffect(() => {
    if (!ccApplied?.code) return;

    const activeLast4 = new Set(
      (appliedGiftCards || [])
        .map(g => String(g?.lastCharacters ?? g?.code ?? '').slice(-4))
        .filter(Boolean)
    );

    const last4 = String(ccApplied.code).slice(-4);
    const stillApplied = last4 && activeLast4.has(last4);

    if (!stillApplied) {
      setCcApplied(null);
      setCcAmount("");
      setCcRedeemToken(null);
    }
  }, [appliedGiftCards, ccApplied]);


  useShopMetafieldValue("custom", "store_id");
  const { post } = useApiPost(getSessionToken);

  const appSettingsMetafield = useAppMetafields({
    namespace: 'follett_store',
    key: 'settings',
  });

  const raw = (
    appSettingsMetafield &&
    appSettingsMetafield[0] &&
    appSettingsMetafield[0].metafield &&
    appSettingsMetafield[0].metafield.value
  ) || '{}';

  var settingsObj;
  try {
    settingsObj = (typeof raw === 'string') ? JSON.parse(raw || '{}') : (raw || {});
  } catch (e) {
    settingsObj = {};
  }

  const storeId = String(settingsObj.store_id || '');
  const financialAidType = String(settingsObj.financial_aid_type || 'CAR-0007');
  const faPinTooltipContent = (settingsObj.fa_pin_tooltip_content == null) ? null : settingsObj.fa_pin_tooltip_content;
  const hideFaBalance = !!settingsObj.hide_fa_balance;
  const faAllowPin = !!settingsObj.fa_allow_pin;
  const ssoEnabled = !!settingsObj.sso_enabled;

  const productIds = useMemo(
    () => (cartLines || []).map((l) => l?.merchandise?.product?.id).filter(Boolean),
    [cartLines]
  );

  const variantIds = useMemo(
    () => (cartLines || []).map((l) => l?.merchandise?.id).filter(Boolean),
    [cartLines]
  );

  const { byProduct, byVariant } = useProductTaxonomyFromStorefront(productIds, variantIds);

  const totalTaxAmountResult = useTotalTaxAmount();
  const taxAmount = Number(totalTaxAmountResult?.amount ?? 0);

  const items = useMemo(() => {
    return (cartLines || []).map((line) => {
      const variant = line?.merchandise;
      const productId = variant?.product?.id || "";
      const variantId = variant?.id || "";
      
      const variantTax = byVariant.get(variantId) || {};
      const productTax = byProduct.get(productId) || {};
      
      const tax = {
        department: variantTax.department || productTax.department || "",
        sub_department: variantTax.sub_department || productTax.sub_department || "",
        class: variantTax.class || productTax.class || "",
        sub_class: variantTax.sub_class || productTax.sub_class || ""
      };
      
      return {
        variant_id: String(variant?.id || ""),
        sku: variant?.sku || "",
        quantity: Number(line?.quantity || 0),
        title: variant?.title || variant?.product?.title || "",
        total_price: Number(line?.cost?.totalAmount?.amount || 0),
        department: tax.department,
        sub_department: tax.sub_department,
        class: tax.class,
        sub_class: tax.sub_class
      };
    });
  }, [cartLines, byProduct, byVariant]);

  const shippingItem = useMemo(() => {
    const amount = Number(totalShippingAmount?.amount || 0);
    if (amount <= 0) return null;

    return {
      variant_id: "SHIPPING",
      sku: "010785368",
      quantity: 1,
      title: "Shipping",
      total_price: amount,
      department: "910",
      sub_department: "600",
      class: "007",
      sub_class: "998",
    };
  }, [totalShippingAmount]);

  const itemsWithShipping = useMemo(() => {
    return shippingItem ? [...items, shippingItem] : items;
  }, [items, shippingItem]);

  const handleFAChange = useCallback((checked) => setFaVisible(checked), []);
  const handleCCChange = useCallback((checked) => setCcVisible(checked), []);
  const handleLookupCCPress = useCallback(async () => {
    setCcLoading(true);
    setCcError(null);
    setCcBalance(null);
    setCcRedeemToken(null);

    // Validação da URL
    if (!financialAidURL) {
      setCcError("Configuration error: API URL not available. Please contact support.");
      setCcLoading(false);
      return;
    }

    if (!String(ccCardNo).trim()) {
      setCcError("Please enter your Campus Card number.");
      setCcLoading(false);
      return;
    }

    if (!String(ccPin).trim() && faAllowPin) {
      setCcError("Please enter your PIN.");
      setCcLoading(false);
      return;
    }

    try {
      const checkoutTotal = Number(totalAmount?.amount || 0);

      const payload = {
        card_no: ccCardNo,
        pin: ccPin,
        shop: shop?.myshopifyDomain || "",
        checkout_token: String(checkoutToken || ""),
        amount: checkoutTotal,
      };
      
      console.log('[CC VALIDATE] Calling API with URL:', financialAidURL);
      console.log('[CC VALIDATE] Payload:', payload);
      const json = await campusCardValidateFetch(getSessionToken, payload, financialAidURL);
      
      console.log('[CC VALIDATE] Response:', json);
      
      if (json.ok === true) {
        // Se ok é true, aplicar automaticamente o valor total do checkout
        console.log('[CC VALIDATE] ✅ Success - applying full checkout amount automatically');
        
        setCcRedeemToken(json.redeemToken);
        setCcAmount(checkoutTotal.toFixed(2));
        
        // Fechar loading do validate
        setCcLoading(false);
        
        // Iniciar processo de redeem inline
        setCcRedeemLoading(true);
        setCcRedeemError(null);

        try {
          const redeemPayload = {
            card_no: ccCardNo,
            pin: ccPin,
            checkout_token: String(checkoutToken || ""),
            redeem_token: json.redeemToken,
            checkout_amount: checkoutTotal,
            checkout_currency: totalAmount?.currencyCode || "USD",
            shop: shop?.myshopifyDomain || "",
          };

          console.log('[CC REDEEM AUTO] Calling API with URL:', financialAidURL);
          console.log('[CC REDEEM AUTO] Payload:', redeemPayload);
          const redeemJson = await campusCardRedeemFetch(getSessionToken, redeemPayload, financialAidURL);

          if (redeemJson.ok && redeemJson.success) {
            const giftCardCode =
              String(redeemJson.gift_card || "").trim() ||
              String(redeemJson.transactionId || "").trim() ||
              String(redeemJson.attributes?.["transaction-id"] || "").trim();

            if (!giftCardCode) {
              setCcRedeemError("Unable to generate gift card.");
              setCcRedeemLoading(false);
              return;
            }

            await removeAllAppliedGiftCards();

            const ts = nowMs();
            suppressVerifyUntilTsRef.current = Math.max(suppressVerifyUntilTsRef.current, ts + GRACE_MS);
            recentlyAddedTsByCodeRef.current.set(giftCardCode, ts);

            const addRes = await applyGiftCardChange({ type: "addGiftCard", code: giftCardCode });
            if (addRes?.type !== "success") {
              setCcRedeemError(addRes?.message || "We were unable to apply your gift card. Please try again.");
              recentlyAddedTsByCodeRef.current.delete(giftCardCode);
              setCcRedeemLoading(false);
              return;
            }

            setCcRedeemToken(null);

            setCcApplied({
              code: giftCardCode,
              amount: redeemJson.chargedAmount || checkoutTotal
            });
            
            try {
              const entry = {
                source: "campusCard",
                code: giftCardCode,
                last4: giftCardCode.slice(-4),
                amount: redeemJson.chargedAmount || checkoutTotal
              };

              await applyAttributeChange({
                type: "updateAttribute",
                key: "follett_giftcards",
                value: JSON.stringify([entry]),
              });

              console.log("[CC APPLY AUTO] ✅ Campus Card saved to attribute");
            } catch (saveErr) {
              console.error("[CC APPLY AUTO] Error saving attribute:", saveErr);
            }
          } else {
            setCcRedeemError(redeemJson?.message || "Unable to generate gift card.");
          }
        } catch (redeemError) {
          let msg = String(redeemError?.message || redeemError || "")
            .replace(/^Error:\s*/i, "")
            .replace(/^HTTP\s+\d+:\s*/i, "");
          const m = msg.match(/\{[\s\S]*\}$/);
          if (m) {
            try {
              const parsed = JSON.parse(m[0]);
              if (parsed?.error) msg = parsed.error;
            } catch {}
          }
          setCcRedeemError(msg.trim() || "Unable to apply Campus Card.");
        } finally {
          setCcRedeemLoading(false);
        }
        
      } else {
        console.log('[CC VALIDATE] ❌ ok is false, checking available balance');
        // Se ok é false, mostra a mensagem e verifica se há balance disponível
        const availableBalance = Number(json.availableBalance || json.remainingBalance || 0);
        
        // Só mostra o balance se for menor que o total do pedido
        if (availableBalance > 0 && availableBalance < checkoutTotal) {
          // Balance disponível menor que o total - permite aplicação parcial
          console.log('[CC VALIDATE] Available balance is lower than checkout total, showing input');
          setCcBalance(availableBalance);
          setCcRedeemToken(json.redeemToken);
          setCcAmount(availableBalance.toFixed(2));
          setCcError(`${json.message || "Unable to authorize full amount"}. You can apply up to $${availableBalance.toFixed(2)} from this card.`);
        } else {
          // Balance é maior ou igual ao total, ou não há balance - só mostra erro
          console.log('[CC VALIDATE] No partial balance available, showing error only');
          setCcError(json.message || "Unable to validate Campus Card.");
        }
      }
    } catch (e) {
      console.error('[CC VALIDATE] Exception:', e);
      let msg = String(e?.message || e || "").replace(/^Error:\s*/i, "").replace(/^HTTP\s+\d+:\s*/i, "");
      const m = msg.match(/\{[\s\S]*\}$/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          if (parsed?.error) msg = parsed.error;
        } catch {}
      }
      setCcError(msg.trim() || "Unable to validate Campus Card.");
    } finally {
      setCcLoading(false);
    }
  }, [
    ccCardNo,
    ccPin,
    shop,
    getSessionToken,
    financialAidURL,
    faAllowPin,
    totalAmount,
    checkoutToken,
    applyGiftCardChange,
    applyAttributeChange
  ]);

  const applyFullCheckoutAmount = useCallback(async (redeemToken, amountToApply) => {
    setCcRedeemLoading(true);
    setCcRedeemError(null);

    try {
      const payload = {
        card_no: ccCardNo,
        pin: ccPin,
        checkout_token: String(checkoutToken || ""),
        redeem_token: redeemToken,
        checkout_amount: amountToApply,
        checkout_currency: totalAmount?.currencyCode || "USD",
        shop: shop?.myshopifyDomain || "",
      };

      console.log('[CC REDEEM AUTO] Calling API with URL:', financialAidURL);
      console.log('[CC REDEEM AUTO] Payload:', payload);
      const json = await campusCardRedeemFetch(getSessionToken, payload, financialAidURL);

      if (json.ok && json.success) {
        const giftCardCode =
          String(json.gift_card || "").trim() ||
          String(json.transactionId || "").trim() ||
          String(json.attributes?.["transaction-id"] || "").trim();

        if (!giftCardCode) {
          setCcRedeemError("Unable to generate gift card.");
          setCcRedeemLoading(false);
          return;
        }

        await removeAllAppliedGiftCards();

        const ts = nowMs();
        suppressVerifyUntilTsRef.current = Math.max(suppressVerifyUntilTsRef.current, ts + GRACE_MS);
        recentlyAddedTsByCodeRef.current.set(giftCardCode, ts);

        const addRes = await applyGiftCardChange({ type: "addGiftCard", code: giftCardCode });
        if (addRes?.type !== "success") {
          setCcRedeemError(addRes?.message || "We were unable to apply your gift card. Please try again.");
          recentlyAddedTsByCodeRef.current.delete(giftCardCode);
          setCcRedeemLoading(false);
          return;
        }

        setCcRedeemToken(null);

        setCcApplied({
          code: giftCardCode,
          amount: json.chargedAmount || amountToApply
        });
        
        try {
          const entry = {
            source: "campusCard",
            code: giftCardCode,
            last4: giftCardCode.slice(-4),
            amount: json.chargedAmount || amountToApply
          };

          await applyAttributeChange({
            type: "updateAttribute",
            key: "follett_giftcards",
            value: JSON.stringify([entry]),
          });

          console.log("[CC APPLY AUTO] ✅ Campus Card saved to attribute");
        } catch (saveErr) {
          console.error("[CC APPLY AUTO] Error saving attribute:", saveErr);
        }
      } else {
        setCcRedeemError(json?.message || "Unable to generate gift card.");
      }
    } catch (e) {
      let msg = String(e?.message || e || "")
        .replace(/^Error:\s*/i, "")
        .replace(/^HTTP\s+\d+:\s*/i, "");
      const m = msg.match(/\{[\s\S]*\}$/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          if (parsed?.error) msg = parsed.error;
        } catch {}
      }
      setCcRedeemError(msg.trim() || "Unable to apply Campus Card.");
    } finally {
      setCcRedeemLoading(false);
    }
  }, [
    ccCardNo,
    ccPin,
    checkoutToken,
    totalAmount,
    shop,
    getSessionToken,
    financialAidURL,
    applyGiftCardChange,
    applyAttributeChange
  ]);

  const handleGenerateCCPress = useCallback(async () => {
    setCcRedeemLoading(true);
    setCcRedeemError(null);

    if (!financialAidURL) {
      setCcRedeemError("Configuration error: API URL not available. Please contact support.");
      setCcRedeemLoading(false);
      return;
    }

    const amountNum = Number(String(ccAmount).replace(/[^\d.]/g, ""));
    const checkoutTotal = Number(totalAmount?.amount || 0);

    if (amountNum > checkoutTotal) {
      setCcRedeemError("Amount exceeds checkout total.");
      setCcRedeemLoading(false);
      return;
    }
    if (!amountNum || amountNum <= 0) {
      setCcRedeemError("Please enter a valid amount.");
      setCcRedeemLoading(false);
      return;
    }
    if (!ccBalance || amountNum > ccBalance) {
      setCcRedeemError("Amount exceeds available balance.");
      setCcRedeemLoading(false);
      return;
    }

    try {
      let redeemToken = ccRedeemToken;

      if (!redeemToken) {
        console.log('[CC REDEEM] No redeemToken, validating first...');
        const validatePayload = {
          card_no: ccCardNo,
          pin: ccPin,
          shop: shop?.myshopifyDomain || "",
          checkout_token: String(checkoutToken || ""),
          amount: amountNum,
        };
        const v = await campusCardValidateFetch(getSessionToken, validatePayload, financialAidURL);
        if (!v?.ok || !v?.redeemToken) {
          throw new Error(v?.message || "Unable to validate Campus Card.");
        }
        if (typeof v.balance === "number") setCcBalance(v.balance);
        redeemToken = v.redeemToken;
        setCcRedeemToken(redeemToken);
      }

      const payload = {
        card_no: ccCardNo,
        pin: ccPin,
        checkout_token: String(checkoutToken || ""),
        redeem_token: redeemToken,
        checkout_amount: `${amountNum}`,
        checkout_currency: totalAmount?.currencyCode || "USD",
        shop: shop?.myshopifyDomain || "",
      };

      console.log('[CC REDEEM] Calling API with URL:', financialAidURL);
      console.log('[CC REDEEM] Payload:', payload);
      const json = await campusCardRedeemFetch(getSessionToken, payload, financialAidURL);

      if (json.ok && json.success) {
        const giftCardCode =
          String(json.gift_card || "").trim() ||
          String(json.transactionId || "").trim() ||
          String(json.attributes?.["transaction-id"] || "").trim();

        if (!giftCardCode) {
          setCcRedeemError("Unable to generate gift card.");
          setCcRedeemLoading(false);
          return;
        }

        await removeAllAppliedGiftCards();

        const ts = nowMs();
        suppressVerifyUntilTsRef.current = Math.max(suppressVerifyUntilTsRef.current, ts + GRACE_MS);
        recentlyAddedTsByCodeRef.current.set(giftCardCode, ts);

        const addRes = await applyGiftCardChange({ type: "addGiftCard", code: giftCardCode });
        if (addRes?.type !== "success") {
          setCcRedeemError(addRes?.message || "We were unable to apply your gift card. Please try again.");
          recentlyAddedTsByCodeRef.current.delete(giftCardCode);
          setCcRedeemLoading(false);
          return;
        }

        setCcRedeemToken(null);

        setCcApplied({
          code: giftCardCode,
          amount: json.chargedAmount || amountNum
        });
        
        try {
          const entry = {
            source: "campusCard",
            code: giftCardCode,
            last4: giftCardCode.slice(-4),
            amount: json.chargedAmount || amountNum
          };

          await applyAttributeChange({
            type: "updateAttribute",
            key: "follett_giftcards",
            value: JSON.stringify([entry]),
          });

          console.log("[CC APPLY] ✅ Campus Card saved to attribute");
        } catch (saveErr) {
          console.error("[CC APPLY] Error saving attribute:", saveErr);
        }
      } else {
        setCcRedeemError(json?.message || "Unable to generate gift card.");
      }
    } catch (e) {
      let msg = String(e?.message || e || "")
        .replace(/^Error:\s*/i, "")
        .replace(/^HTTP\s+\d+:\s*/i, "");
      const m = msg.match(/\{[\s\S]*\}$/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          if (parsed?.error) msg = parsed.error;
        } catch {}
      }
      setCcRedeemError(msg.trim() || "Unable to validate Campus Card.");
    } finally {
      setCcRedeemLoading(false);
    }
  }, [
    ccAmount,
    ccBalance,
    ccCardNo,
    ccPin,
    checkoutToken,
    totalAmount,
    shop,
    getSessionToken,
    ccRedeemToken,
    applyGiftCardChange,
    financialAidURL,
    applyAttributeChange
  ]);

  const lookupColumns = useMemo(
    () => (faAllowPin ? ["25%", "25%", "50%"] : ["50%", "fill"]),
    [faAllowPin]
  );

  function buildDiscountCodesPayload(discountCodes) {
    return (discountCodes || [])
      .map((d) => (typeof d === "string" ? d : String(d?.code ?? "")))
      .filter(Boolean);
  }

  const isLookupInProgressRef = useRef(false);

  const handleLookupIdPress = useCallback(async () => {
    console.log("[FA LOOKUP] Starting lookup...");
    
    // Cancel any pending debounced calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (isLookupInProgressRef.current) {
      console.log("[FA LOOKUP] Already in progress, skipping");
      return;
    }
    
    isLookupInProgressRef.current = true;
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let skipShippingValidation = false;
    
    for ( let i = 0 ; i < cartLines.length ; i++ ) {
      for ( let u = 0 ; u < cartLines[i].attributes.length ; u++ ) {
        if (cartLines[i].attributes[u].key == "Format" && cartLines[i].attributes[u].value == "Digital") {
          console.log("AAA", cartLines[i].attributes[u].key, cartLines[i].attributes[u].value == "Digital")
          skipShippingValidation = true;
        }
      }
    }

    const shippingOk = addressIsSufficient(shippingAddressHook, true, true);
    const billingOk = addressIsSufficient(billingAddressHook, true, true);
    
    const shippingHasName = !!(shippingAddressHook?.firstName || shippingAddressHook?.lastName);
    const billingHasName = !!(billingAddressHook?.firstName || billingAddressHook?.lastName);
    const addressOk = shippingOk || (billingOk && billingHasName && !shippingHasName);

    if (!addressOk && !skipShippingValidation) {
      setLastError("Please complete your address (last name, state/province, zip/postal code and phone) before applying funds.");
      setLoading(false);
      isLookupInProgressRef.current = false;
      return;
    }
    

    // Record loading start time for minimum display duration
    loadingStartTimeRef.current = Date.now();
    setLoading(true);
    setLastError(null);
    setLastResponse(null);
    lastLookupTotalRef.current = Number(totalAmount?.amount ?? 0);

    if (!String(studentId).trim()) {
      setLastError("Please enter your Student ID.");
      setLoading(false);
      isLookupInProgressRef.current = false;
      return;
    }
    if (faAllowPin && !String(pin).trim()) {
      setLastError("Please enter your PIN.");
      setLoading(false);
      isLookupInProgressRef.current = false;
      return;
    }

    if (!customer?.email && !buyerEmail) {
      setLastError("Please complete your address (last name, state/province and zip/postal code) and email before applying funds.");
      setLoading(false);
      isLookupInProgressRef.current = false;
      return;
    }

    try {
      const currentTotal = Number(totalAmount?.amount ?? 0);

      const giftCardsTotal = (appliedGiftCards || []).reduce((sum, gc) => {
        const raw =
          gc?.amountUsedV2?.amount ??
          gc?.amountUsed?.amount ??
          gc?.balanceUsedV2?.amount ??
          gc?.balanceUsed?.amount ??
          0;

        const used = Number(raw);
        return sum + (Number.isFinite(used) ? used : 0);
      }, 0);

      const netTotal = Math.max(0, Number((currentTotal - giftCardsTotal).toFixed(2)));

      console.log("[FA LOOKUP]", { currentTotal, giftCardsTotal, netTotal });

      const effectiveTotal = Math.max(0, currentTotal - giftCardsTotal);
      lastSentAmountRef.current = (Math.round(effectiveTotal * 100) / 100).toFixed(2);

      const payload = {
        student_id: studentId,
        ...(faAllowPin ? { pin: String(pin) } : {}),
        customer_id: customer?.id || "",
        customer_email: effectiveEmail,
        shop_domain: shop?.myshopifyDomain || "",
        financial_aid_type: financialAidType,
        epay_store_id: storeId,
        amount: (Math.round(effectiveTotal * 100) / 100).toFixed(2),
        total_amount: (Math.round(effectiveTotal * 100) / 100).toFixed(2),
        shipping_amount: String(totalShippingAmount?.amount || 0),
        shipping_address: buildShippingAddressWithBillingFallback(shippingAddressHook, billingAddressHook),
        billing_address: buildAddress(billingAddressHook || {}),
        discount_codes: buildDiscountCodesPayload(discountCodesHook),
        applied_giftcards: buildAppliedGiftcardsPayload(appliedGiftCards),
        items: itemsWithShipping,
        tax_amount: String(taxAmount)
      };
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        console.log("[FA LOOKUP] Request aborted");
        return;
      }
      
      const json = await studentIdLookupFetch(getSessionToken, payload, abortController.signal, financialAidURL);
      
      // Check again after fetch completes
      if (abortController.signal.aborted) {
        console.log("[FA LOOKUP] Request aborted after fetch");
        return;
      }
      
      console.log("[FA LOOKUP] Success:", {
        accountsFound: json?.data?.length || 0,
        data: json?.data
      });

      try {
        const lookupData = {
          request_payload: {
            student_id: payload.student_id,
            customer_id: payload.customer_id,
            customer_email: payload.customer_email,
            shop_domain: payload.shop_domain,
            financial_aid_type: payload.financial_aid_type,
            epay_store_id: payload.epay_store_id,
            amount: payload.amount,
            total_amount: payload.total_amount,
            shipping_amount: payload.shipping_amount,
            shipping_address: payload.shipping_address,
            billing_address: payload.billing_address,
            discount_codes: payload.discount_codes,
            applied_giftcards: payload.applied_giftcards,
            items: payload.items,
            tax_amount: payload.tax_amount,
            restricted_items: json?.data[0]?.restricted_items ?? [],
          }
        };

        await applyAttributeChange({
          type: "updateAttribute",
          key: "follett_lookup_data",
          value: JSON.stringify(lookupData),
        });

        console.log("[FA LOOKUP] ✅ Complete lookup data saved to attribute:", lookupData);
      } catch (saveErr) {
        console.error("[FA LOOKUP] Error saving lookup data:", saveErr);
      }
      
      setLastResponse(json);
      
    } catch (e) {
      // Ignore abort errors
      if (e.name === 'AbortError' || abortController.signal.aborted) {
        console.log("[FA LOOKUP] Request cancelled");
        return;
      }
      let msg = String(e?.message || e || "").replace(/^Error:\s*/i, "").replace(/^HTTP\s+\d+:\s*/i, "");
      const m = msg.match(/\{[\s\S]*\}$/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          if (parsed?.error) msg = parsed.error;
        } catch {}
      }
      console.error("[FA LOOKUP] Error:", msg);
      setLastError(msg.trim());
    } finally {
      // Ensure minimum loading display time to prevent flickering (300ms)
      const loadingStartTime = loadingStartTimeRef.current || Date.now();
      const elapsedTime = Date.now() - loadingStartTime;
      const minLoadingTime = 300; // Minimum 300ms to prevent flickering
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        setTimeout(() => {
          setLoading(false);
          cleanupLookup();
        }, remainingTime);
      } else {
        setLoading(false);
        cleanupLookup();
      }
    }
    
    function cleanupLookup() {
      // Clear abort controller
      abortControllerRef.current = null;
      
      // Clear lookup flag with delay to allow state restoration
      setTimeout(() => {
        isLookupInProgressRef.current = false;
        console.log("[FA LOOKUP] Lookup complete, flag cleared");
      }, 1000);
    }
  }, [
    studentId,
    pin,
    faAllowPin,
    customer,
    buyerEmail,
    effectiveEmail,
    shop,
    totalAmount,
    totalShippingAmount,
    itemsWithShipping,
    taxAmount,
    shippingAddressHook,
    billingAddressHook,
    discountCodesHook,
    appliedGiftCards,
    storeId,
    financialAidType,
    getSessionToken
  ]);

  const isRestoringRef = useRef(false);

  useEffect(() => {
    // Só restaura o estado quando há um lookup bem-sucedido
    if (!lastResponse || !Array.isArray(lastResponse.data) || lastResponse.data.length === 0) {
      return;
    }

    // Criar uma chave única para este lookup (baseada nos IDs das contas)
    const lookupKey = lastResponse.data
      .map(fa => String(fa.record_unique_id))
      .sort()
      .join('|');

    // Se já restauramos para este lookup, não faz nada
    if (hasRestoredForLookupRef.current === lookupKey) {
      return;
    }

    // MARCA QUE ESTÁ RESTAURANDO
    isRestoringRef.current = true;

    // Ler o atributo follett_giftcards
    const faAttr = (attributes || []).find(attr => attr.key === "follett_giftcards");
    
    if (!faAttr?.value) {
      console.log("[FA RESTORE] No follett_giftcards attribute found");
      isRestoringRef.current = false;
      return;
    }

    console.log("[FA RESTORE] Found attribute:", faAttr.value);

    try {
      const stored = JSON.parse(faAttr.value);
      if (!Array.isArray(stored)) {
        console.log("[FA RESTORE] Attribute is not an array");
        isRestoringRef.current = false;
        return;
      }

      // Filtrar apenas entries de Financial Aid
      const faEntries = stored.filter(entry => entry && entry.source === "financialAid");
      
      if (faEntries.length === 0) {
        console.log("[FA RESTORE] No FA entries found in attribute");
        isRestoringRef.current = false;
        return;
      }

      console.log("[FA RESTORE] FA entries from attribute:", faEntries);

      // Criar mapa de gift cards atualmente aplicados no checkout (por last4)
      const appliedGiftCardsMap = new Map();
      (appliedGiftCards || []).forEach(gc => {
        const last4 = String(gc?.lastCharacters ?? gc?.code ?? '').slice(-4);
        if (last4) {
          const amount = Number(
            gc?.amountUsedV2?.amount ??
            gc?.amountUsed?.amount ??
            gc?.balanceUsedV2?.amount ??
            gc?.balanceUsed?.amount ??
            0
          );
          const code = String(gc?.code ?? gc?.lastCharacters ?? '');
          appliedGiftCardsMap.set(last4, {
            code: code,
            amount: Number.isFinite(amount) ? amount : 0
          });
          console.log("[FA RESTORE] Gift card in checkout - last4:", last4, "code:", code, "amount:", amount);
        }
      });

      console.log("[FA RESTORE] Applied gift cards map:", Array.from(appliedGiftCardsMap.entries()));

      // Comparar cada FA do lookup com os entries salvos
      const restoredFA = {};
      
      lastResponse.data.forEach(fa => {
        const faId = String(fa.record_unique_id);
        const description = String(fa.description || "");
        
        console.log("[FA RESTORE] Checking FA from lookup:", { faId, description });
        
        // Procurar entry salvo que corresponde a este FA
        const matchingEntry = faEntries.find(entry => {
          const entryFaId = String(entry.financialAidId || "");
          const entryDescription = String(entry.description || "");
          
          // Match por ID ou por descrição
          const matchById = entryFaId === faId;
          const matchByDesc = entryDescription === description;
          
          console.log("[FA RESTORE] Comparing with entry:", {
            entryFaId,
            entryDescription,
            matchById,
            matchByDesc
          });
          
          return matchById || matchByDesc;
        });

        if (!matchingEntry) {
          console.log("[FA RESTORE] No matching entry found for FA:", faId);
          return;
        }

        console.log("[FA RESTORE] Found matching entry:", matchingEntry);

        const entryLast4 = String(matchingEntry.code || "").slice(-4);
        const appliedGC = appliedGiftCardsMap.get(entryLast4);

        console.log("[FA RESTORE] Looking for gift card with last4:", entryLast4, "found:", appliedGC);

        if (appliedGC) {
          restoredFA[faId] = {
            code: appliedGC.code,
            amount: appliedGC.amount.toFixed(2)
          };

          console.log("[FA RESTORE] ✅ Restored FA account:", {
            faId,
            description,
            code: appliedGC.code,
            amount: appliedGC.amount
          });
        }
      });

      // Atualizar o estado apenas se encontramos FAs restaurados
      if (Object.keys(restoredFA).length > 0) {
        // Marca que já restaurou para este lookup
        hasRestoredForLookupRef.current = lookupKey;
        
        console.log("[FA RESTORE] Setting appliedByFA with:", restoredFA);
        
        setAppliedByFA(prev => {
          const merged = { ...prev, ...restoredFA };
          console.log("[FA RESTORE] Previous appliedByFA:", prev);
          console.log("[FA RESTORE] Merged appliedByFA:", merged);
          return merged;
        });

        console.log("[FA RESTORE] Total restored:", Object.keys(restoredFA).length);
      } else {
        console.log("[FA RESTORE] No FA accounts to restore");
      }

    } catch (e) {
      console.error("[FA RESTORE] Failed to restore FA state:", e);
    } finally {
      isRestoringRef.current = false;
    }
  }, [lastResponse, attributes, appliedGiftCards]);

  const handleAmountChange = useCallback((faId, val) => {
    setAmountByFA((prev) => ({ ...prev, [faId]: val }));
  }, []);

  const getMaxApplicableAmount = (fa) => {
    const eligible = Number(fa?.eligible_amount ?? 0);
    const available = Number(fa?.available_balance ?? 0);

    const max = Math.max(0, Math.min(eligible, available));

    return max.toFixed(2);
  };

  useEffect(() => {
    if (!Array.isArray(lastResponse?.data) || lastResponse.data.length === 0) return;

    setAmountByFA((prev) => {
      const next = { ...prev };
      for (const fa of lastResponse.data) {
        const faId = String(fa.record_unique_id);
        if (next[faId] == null || String(next[faId]).trim() === "") {
          next[faId] = getMaxApplicableAmount(fa);
        }
      }
      return next;
    });
  }, [lastResponse]);


  useEffect(() => {
    if (!faVisible || !lookupHasData || !studentId) {
      prevGiftCardsKeyRef.current = giftCardsKey(appliedGiftCards);
      return;
    }

    // Clear any pending debounced call
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const currentTotal = Number(totalAmount?.amount ?? 0);
    const lastTotal = Number(lastLookupTotalRef.current ?? Number.NaN);

    const currKey = giftCardsKey(appliedGiftCards);
    const prevKey = prevGiftCardsKeyRef.current;

    const totalChanged =
      !Number.isFinite(lastTotal) || Math.abs(currentTotal - lastTotal) > 0.01;
    const giftCardsChanged = currKey !== prevKey;

    if ((totalChanged || giftCardsChanged) && nowMs() >= suppressVerifyUntilTsRef.current) {
      lastLookupTotalRef.current = Number.NaN;
      
      if (isLookupInProgressRef.current) {
        console.log("[FA AUTO-LOOKUP] Skipping - lookup already in progress");
        prevGiftCardsKeyRef.current = currKey;
        return;
      }
      
      // Debounce API calls to prevent rapid-fire requests during rental eligibility checks
      // This prevents Pay Now button flickering when rental options/pricing change rapidly
      console.log("[FA AUTO-LOOKUP] Debouncing lookup due to total/gift card changes");
      
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        
        // Double-check that lookup is still not in progress
        if (isLookupInProgressRef.current) {
          console.log("[FA AUTO-LOOKUP] Skipping debounced call - lookup started during debounce");
          prevGiftCardsKeyRef.current = currKey;
          return;
        }
        
        console.log("[FA AUTO-LOOKUP] Executing debounced lookup");
        handleLookupIdPress();
      }, 400); // 400ms debounce delay
    }

    prevGiftCardsKeyRef.current = currKey;
    
    // Cleanup function to clear debounce timer
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [
    faVisible,
    lastResponse,
    studentId,
    totalAmount?.amount,
    totalShippingAmount?.amount,
    appliedGiftCards,
    handleLookupIdPress
  ]);

  // Poll every 1s: if the checkout total drifted from the amount sent in
  // the last studentid-lookup, automatically re-trigger the lookup.
  // This covers edge-cases where taxes / shipping are recalculated after the
  // initial lookup and the useEffect-based approach misses the change.
  const totalAmountRef = useRef(totalAmount);
  useEffect(() => { totalAmountRef.current = totalAmount; }, [totalAmount]);

  const appliedGiftCardsForPollRef = useRef(appliedGiftCards);
  useEffect(() => { appliedGiftCardsForPollRef.current = appliedGiftCards; }, [appliedGiftCards]);

  useEffect(() => {
    // Only start polling after a successful lookup while the FA section is visible
    if (!faVisible || !lastResponse?.data?.length || !studentId) return;

    const interval = setInterval(() => {
      // Don't interfere with a lookup already running
      if (isLookupInProgressRef.current) return;

      const sentAmount = lastSentAmountRef.current;
      if (sentAmount === null) return;

      const currentTotal = Number(totalAmountRef.current?.amount ?? 0);

      const gcTotal = (appliedGiftCardsForPollRef.current || []).reduce((sum, gc) => {
        const raw =
          gc?.amountUsedV2?.amount ??
          gc?.amountUsed?.amount ??
          gc?.balanceUsedV2?.amount ??
          gc?.balanceUsed?.amount ?? 0;
        const used = Number(raw);
        return sum + (Number.isFinite(used) ? used : 0);
      }, 0);

      const effectiveCurrent = (Math.round(Math.max(0, currentTotal - gcTotal) * 100) / 100).toFixed(2);

      if (effectiveCurrent !== sentAmount) {
        console.log("[FA POLL] Amount mismatch detected", { sentAmount, effectiveCurrent });
        lastSentAmountRef.current = null; // prevent re-fire until next lookup sets it
        handleLookupIdPress();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [faVisible, lastResponse, studentId, handleLookupIdPress]);

  const handleApplyFundsPress = useCallback(
    async (fa) => {
      const faId = String(fa?.record_unique_id || "");
      const taxExempt = Boolean(fa?.tax_exempt);
      console.log("[FA DEBUG] handleApplyFundsPress called", { faId, fa });

      if (!faId) {
        console.log("[FA DEBUG] Missing faId, aborting");
        return;
      }

      setErrorByFA((prev) => ({ ...prev, [faId]: "" }));
      setLoadingByFA((prev) => ({ ...prev, [faId]: true }));

      if (!customer?.email && !buyerEmail) {
        const msg =
          "Please complete your address (last name, state/province and zip/postal code) and email before applying funds.";
        console.log("[FA DEBUG] Missing email:", msg);
        setErrorByFA((prev) => ({
          ...prev,
          [faId]: msg,
        }));
        setLoadingByFA((prev) => ({ ...prev, [faId]: false }));
        return;
      }

      try {
        const eligible = Number(fa?.eligible_amount ?? 0);
        const available = Number(fa?.available_balance ?? 0);
        const orderTotal = Number(totalAmount?.amount ?? 0);

        const safeEligible = Number.isFinite(eligible) ? eligible : 0;
        const safeAvailable = Number.isFinite(available) ? available : 0;
        const safeOrderTotal = Number.isFinite(orderTotal) ? orderTotal : 0;

        const amountNum = Math.max(
          0,
          Math.min(safeEligible, safeAvailable, safeOrderTotal)
        );

        console.log("[FA DEBUG] amount calc", {
          eligible,
          available,
          orderTotal,
          safeEligible,
          safeAvailable,
          safeOrderTotal,
          amountNum,
        });

        if (!(amountNum > 0)) {
          const msg =
            `Your ${fa?.description || "financial aid"} is not available to use online at this time. Please contact your store for details.`;
          console.log("[FA DEBUG] amountNum <= 0:", msg);
          setErrorByFA((prev) => ({
            ...prev,
            [faId]: msg,
          }));
          setLoadingByFA((prev) => ({ ...prev, [faId]: false }));
          return;
        }

        const shippingOk = addressIsSufficient(shippingAddressHook, true, true);
        const billingOk = addressIsSufficient(billingAddressHook, true, true);
        let skipShippingValidation = false;

        for ( let i = 0 ; i < cartLines.length ; i++ ) {
          for ( let u = 0 ; u < cartLines[i].attributes.length ; u++ ) {
            if (cartLines[i].attributes[u].key == "Format" && cartLines[i].attributes[u].value == "Digital") {
              console.log("AAA", cartLines[i].attributes[u].key, cartLines[i].attributes[u].value == "Digital")
              skipShippingValidation = true;
            }
          }
        }
        
        const shippingHasName = !!(shippingAddressHook?.firstName || shippingAddressHook?.lastName);
        const billingHasName = !!(billingAddressHook?.firstName || billingAddressHook?.lastName);
        const addressOk = shippingOk || (billingOk && billingHasName && !shippingHasName);
        
        if (!addressOk && !skipShippingValidation) {
          const msg =
            "Please complete your address (last name, state/province, zip/postal code and phone) before applying funds.";
          console.log("[FA DEBUG] Shipping address insufficient:", msg);
          setErrorByFA((prev) => ({
            ...prev,
            [faId]: msg,
          }));
          setLoadingByFA((prev) => ({ ...prev, [faId]: false }));
          return;
        }

        const currentAppliedGiftCards = appliedGiftCardsRef.current || appliedGiftCards || [];

        const payload = {
          student_id: studentId || "",
          customer_id: customer?.id || "",
          customer_email: effectiveEmail,
          shop_domain: shop?.myshopifyDomain || "",
          financial_aid_type: financialAidType,
          epay_store_id: storeId,
          major_account_id: String(fa?.major_account_id || ""),
          billing_number: String(fa?.billing_number || ""),
          record_unique_id: faId,
          amount: (Math.round(amountNum * 100) / 100).toFixed(2),
          total_amount: (
            Math.round(safeOrderTotal * 100) / 100
          ).toFixed(2),
          shipping_amount: String(totalShippingAmount?.amount || 0),
          shipping_address: buildShippingAddressWithBillingFallback(shippingAddressHook, billingAddressHook),
          billing_address: buildAddress(billingAddressHook || {}),
          discount_codes: (function buildDiscountCodesPayload(discountCodes) {
            return (discountCodes || [])
              .map(function (d) {
                return typeof d === "string"
                  ? d
                  : String((d && d.code) || "");
              })
              .filter(Boolean);
          })(discountCodesHook),
          applied_giftcards: buildAppliedGiftcardsPayload(currentAppliedGiftCards),
          items: itemsWithShipping,
          checkout_token: String(checkoutToken || ""),
          tax_amount: String(taxAmount),
        };

        console.log("[FA DEBUG] Calling generateGiftCardFetch with payload", payload);

        const json = await generateGiftCardFetch(post, payload, financialAidURL);

        console.log("[FA DEBUG] generateGiftCardFetch response", json);

        const code = String(json?.data?.gift_card_code || "").trim();

        if (!code) {
          const msg =
            "We were unable to apply your funds. Please try again.";
          console.log("[FA DEBUG] Missing gift_card_code in response");
          setErrorByFA((prev) => ({
            ...prev,
            [faId]: msg,
          }));
          setLoadingByFA((prev) => ({ ...prev, [faId]: false }));
          return;
        }

        const ts = nowMs();
        suppressVerifyUntilTsRef.current = Math.max(
          suppressVerifyUntilTsRef.current,
          ts + GRACE_MS
        );
        const map = recentlyAddedTsByCodeRef.current;
        map.set(code, ts);

        console.log("[FA DEBUG] Applying gift card via applyGiftCardChange", code);

        const addRes = await applyGiftCardChange({
          type: "addGiftCard",
          code,
        });

        console.log("[FA DEBUG] applyGiftCardChange result", addRes);

        if (addRes?.type !== "success") {
          setErrorByFA((prev) => ({
            ...prev,
            [faId]:
              addRes?.message ||
              "We were unable to apply your gift card. Please try again.",
          }));
          map.delete(code);
          setLoadingByFA((prev) => ({ ...prev, [faId]: false }));
          return;
        }

        await new Promise(function (r) {
          return setTimeout(r, 500);
        });

        const last4 = String(code).slice(-4);
        const live = (appliedGiftCardsRef.current || []).find(function (g) {
          const lc = String(g?.lastCharacters || "").slice(-4);
          const cc = String(g?.code || "").slice(-4);
          return lc === last4 || cc === last4;
        });

        const usedRaw =
          (live &&
            (live.amountUsedV2?.amount ??
              live.amountUsed?.amount ??
              live.balanceUsedV2?.amount ??
              live.balanceUsed?.amount)) ??
          null;

        const usedNum = Number(usedRaw);
        const appliedEffective = Number.isFinite(usedNum)
          ? usedNum
          : amountNum;

        const newAppliedData = {
          amount: (
            Math.round(appliedEffective * 100) / 100
          ).toFixed(2),
          code,
        };

        setAppliedByFA((prev) => ({
          ...prev,
          [faId]: newAppliedData,
        }));

        const currentCheckoutTotal = Number(totalAmount?.amount ?? 0);
        lastAppliedTotalRef.current = currentCheckoutTotal;

        console.log("[FA DEBUG] Saved checkout total at apply:", currentCheckoutTotal);

        console.log("[FA DEBUG] AppliedByFA updated for", faId, newAppliedData);

        const description = String(fa?.description || "");
        const major_account_id = String(fa?.major_account_id || "");
        const billing_number = String(fa?.billing_number || "");

        const entry = {
          source: "financialAid",
          financialAidId: faId,
          description,
          major_account_id,
          billing_number,
          code,
          last4: code.slice(-4),
          amount: Number.isFinite(appliedEffective) ? appliedEffective : 0,
          studentId: studentId || "",
          taxExempt: taxExempt
        };

        console.log("[FA DEBUG] Force saving attribute with entry:", entry);

        try {
          const saveResult = await applyAttributeChange({
            type: "updateAttribute",
            key: "follett_giftcards",
            value: JSON.stringify([entry]),
          });

          if (saveResult?.type === "error") {
            console.error("[FA DEBUG] Failed to save attribute:", saveResult.message);
          } else {
            console.log("[FA DEBUG] ✅ Attribute saved successfully!");
          }
        } catch (saveErr) {
          console.error("[FA DEBUG] Error saving attribute:", saveErr);
        }

      } catch (e) {
        let msg = String(e?.message || e || "")
          .replace(/^Error:\s*/i, "")
          .replace(/^HTTP\s+\d+:\s*/i, "");
        const m = msg.match(/\{[\s\S]*\}$/);
        if (m) {
          try {
            const parsed = JSON.parse(m[0]);
            if (parsed && parsed.error) msg = parsed.error;
          } catch (err) {}
        }
        console.error("[FA DEBUG] handleApplyFundsPress error", e);
        setErrorByFA((prev) => ({
          ...prev,
          [faId]: msg.trim() || "Unexpected error.",
        }));
      } finally {
        setLoadingByFA((prev) => ({ ...prev, [faId]: false }));
      }
    },
    [
      studentId,
      customer,
      buyerEmail,
      effectiveEmail,
      shop,
      totalAmount,
      totalShippingAmount,
      shippingAddressHook,
      billingAddressHook,
      discountCodesHook,
      appliedGiftCards,
      itemsWithShipping,
      checkoutToken,
      taxAmount,
      financialAidType,
      storeId,
      post,
      applyGiftCardChange,
      applyAttributeChange,
    ]
  );

  const handleRemoveFundsPress = useCallback(
    async (fa) => {
      const faId = String(fa?.record_unique_id || "");
      const applied = appliedByFA[faId];
      if (!faId || !applied?.code) return;
      
      try {
        setLoading(true);
        setLastError(null);
        
        const token = await getSessionToken();

        const resp = await fetch(
          `${financialAidURL}/api/financial-aid/remove-giftcard`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Shopify-Session-Token": token,
            },
            body: JSON.stringify({
              student_id: studentId || "",
              customer_id: customer?.id || "",
              customer_email: effectiveEmail,
              shop_domain: shop?.myshopifyDomain || "",
              financial_aid_type: financialAidType,
              epay_store_id: storeId,
              major_account_id: String(fa?.major_account_id || ""),
              billing_number: String(fa?.billing_number || ""),
              record_unique_id: faId,
              gift_card_code: String(applied?.code || "")
            }),
          }
        );

        const data = await resp.json();
        const gcToRemove = String(data?.data?.gift_card_code || applied.code).trim();

        if (gcToRemove) {
          await applyGiftCardChange({ type: "removeGiftCard", code: gcToRemove });
        }

        setAppliedByFA((prev) => {
          const copy = { ...prev };
          delete copy[faId];
          return copy;
        });

        recentlyAddedTsByCodeRef.current.delete(applied.code);
        
        const remaining = Object.keys(appliedByFA).filter(id => id !== faId);
        
        if (remaining.length === 0 && !ccApplied) {
          console.log("[FA REMOVE] Clearing attribute - last FA removed");
          try {
            await applyAttributeChange({
              type: "updateAttribute",
              key: "follett_giftcards",
              value: "[]",
            });
          } catch (err) {
            console.error("[FA REMOVE] Error clearing attribute:", err);
          }
        }
        
      } catch (e) {
        setLastError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [appliedByFA, ccApplied, studentId, customer, effectiveEmail, shop, applyGiftCardChange, getSessionToken, applyAttributeChange, financialAidType, storeId]
  );

  const handleEditFundsPress = useCallback(async (fa) => {
    await handleRemoveFundsPress(fa);
  }, [handleRemoveFundsPress]);

  useEffect(() => {
    const activeLast4 = new Set((appliedGiftCards || []).map((g) => String(g?.lastCharacters || "")));

    const removedFaIds = Object.entries(appliedByFA)
      .filter(([, info]) => {
        const codeFull = String(info?.code || "");
        const last4 = codeFull.slice(-4);
        if (!last4) return false;

        const ts = recentlyAddedTsByCodeRef.current.get(codeFull);
        if (ts && nowMs() - ts < GRACE_MS) {
          return false;
        }

        return !activeLast4.has(last4);
      })
      .map(([faId]) => faId);

    if (!removedFaIds.length) return;

    console.log("[FA AUTO-REMOVE] Detected removed FA gift cards:", removedFaIds);

    removedFaIds.forEach(async (faId) => {
      const info = appliedByFA[faId];
      const code = String(info?.code || "");
      if (!code) return;

      if (pendingBackendRemovalsRef.current.has(code)) return;
      pendingBackendRemovalsRef.current.add(code);

      try {
        const faObj = Array.isArray(lastResponse?.data)
          ? lastResponse.data.find((fa) => String(fa.record_unique_id) === String(faId))
          : null;

        const token = await getSessionToken();
        await fetch(`${financialAidURL}/api/financial-aid/remove-giftcard`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Shopify-Session-Token": token,
          },
          body: JSON.stringify({
            student_id: studentId || "",
            customer_id: customer?.id || "",
            customer_email: effectiveEmail,
            shop_domain: shop?.myshopifyDomain || "",
            financial_aid_type: financialAidType,
            epay_store_id: storeId,
            major_account_id: String(faObj?.major_account_id || ""),
            billing_number: String(faObj?.billing_number || ""),
            record_unique_id: String(faId),
            gift_card_code: String(code || ""),
          }),
        });
      } catch (err) {
        console.error("[FA AUTO-REMOVE] Error calling backend remove:", err);
      } finally {
        setAppliedByFA((prev) => {
          const copy = { ...prev };
          delete copy[faId];
          
          const remainingFAs = Object.keys(copy);
          console.log("[FA AUTO-REMOVE] Remaining FAs after removal:", remainingFAs);
          
          if (remainingFAs.length === 0 && !ccApplied?.code) {
            console.log("[FA AUTO-REMOVE] No more FA/CC - clearing attribute");
            (async () => {
              try {
                await applyAttributeChange({
                  type: "updateAttribute",
                  key: "follett_giftcards",
                  value: "[]",
                });
                console.log("[FA AUTO-REMOVE] ✅ Attribute cleared");
              } catch (saveErr) {
                console.error("[FA AUTO-REMOVE] Error clearing attribute:", saveErr);
              }
            })();
          } else {
            console.log("[FA AUTO-REMOVE] Still has FA/CC - updating attribute");
            
            const faDataById = {};
            if (lastResponse && Array.isArray(lastResponse.data)) {
              lastResponse.data.forEach((fa) => {
                const id = String(fa.record_unique_id || "");
                if (!id) return;
                faDataById[id] = fa;
              });
            }

            const remainingEntries = Object.entries(copy).map(([id, info]) => {
              const fa = faDataById[id] || {};
              return {
                source: "financialAid",
                financialAidId: id,
                description: String(fa.description || ""),
                major_account_id: String(fa.major_account_id || ""),
                billing_number: String(fa.billing_number || ""),
                code: String(info?.code || ""),
                last4: String(info?.code || "").slice(-4),
                amount: Number(info?.amount || 0),
                studentId: studentId || ""
              };
            }).filter(Boolean);

            if (ccApplied?.code) {
              remainingEntries.push({
                source: "campusCard",
                code: String(ccApplied.code),
                last4: String(ccApplied.code).slice(-4),
                amount: Number(ccApplied.amount || 0)
              });
            }

            (async () => {
              try {
                await applyAttributeChange({
                  type: "updateAttribute",
                  key: "follett_giftcards",
                  value: JSON.stringify(remainingEntries),
                });
                console.log("[FA AUTO-REMOVE] ✅ Attribute updated with remaining entries");
              } catch (saveErr) {
                console.error("[FA AUTO-REMOVE] Error updating attribute:", saveErr);
              }
            })();
          }
          
          return copy;
        });
        recentlyAddedTsByCodeRef.current.delete(code);
        pendingBackendRemovalsRef.current.delete(code);
      }
    });
  }, [
    appliedGiftCards, 
    appliedByFA, 
    ccApplied, 
    lastResponse, 
    studentId, 
    customer, 
    effectiveEmail, 
    shop, 
    getSessionToken, 
    financialAidType, 
    storeId,
    applyAttributeChange
  ]);

  useEffect(() => {
    if (hasRunInitialVerifyRef.current) {
      return;
    }
    hasRunInitialVerifyRef.current = true;

    if (nowMs() < suppressVerifyUntilTsRef.current) {
      return;
    }

    const faAttr = (attributes || []).find(function (attr) {
      return attr && attr.key === "follett_giftcards";
    });

    var storedEntries = [];
    if (faAttr && faAttr.value) {
      try {
        var parsed = JSON.parse(String(faAttr.value));
        if (Array.isArray(parsed)) {
          storedEntries = parsed;
        }
      } catch (e) {
        storedEntries = [];
      }
    }

    var faCodesFromAttr = storedEntries
      .filter(function (entry) {
        return entry && entry.source === "financialAid";
      })
      .map(function (entry) {
        return String(entry.code || "").trim();
      })
      .filter(Boolean);

    if (!faCodesFromAttr.length) {
      return;
    }

    var activeCodes = new Set(
      (appliedGiftCards || [])
        .map(function (g) {
          var raw = "";
          if (g && g.code) raw = g.code;
          else if (g && g.lastCharacters) raw = g.lastCharacters;
          return String(raw || "").trim();
        })
        .filter(Boolean)
    );

    var codesToVerify = Array.from(
      new Set(
        faCodesFromAttr.filter(function (code) {
          return activeCodes.has(code);
        })
      )
    );

    if (!codesToVerify.length) {
      return;
    }

    (async function () {
      try {
        var payload = {
          shop_domain: (shop && shop.myshopifyDomain) ? shop.myshopifyDomain : "",
          applied_giftcards: codesToVerify,
          items: buildItemsForVerify(items)
        };

        var resp = await verifyGiftCardsFetch(getSessionToken, payload, financialAidURL);

        console.log("[FA DEBUG initial verifyGiftCards]", {
          payload: payload,
          resp: resp
        });

        var invalidSet = new Set();

        if (resp && Array.isArray(resp.invalid_giftcards)) {
          resp.invalid_giftcards.forEach(function (c) {
            invalidSet.add(String(c || "").trim());
          });
        }

        if (resp && Array.isArray(resp.invalid_codes)) {
          resp.invalid_codes.forEach(function (c) {
            invalidSet.add(String(c || "").trim());
          });
        }

        if (resp && Array.isArray(resp.data)) {
          resp.data.forEach(function (entry) {
            if (!entry) return;
            var invalidFlag = (entry.valid === false) || (entry.ok === false);
            if (invalidFlag) {
              var c = String(entry.code || "").trim();
              if (c) invalidSet.add(c);
            }
          });
        }

        if (!invalidSet.size) {
          return;
        }

        for (var code of invalidSet) {
          try {
            await applyGiftCardChange({ type: "removeGiftCard", code: code });
            console.log(
              "[FA DEBUG initial verifyGiftCards] Removed invalid FA gift card:",
              code
            );
          } catch (err) {
            console.error(
              "[FA DEBUG initial verifyGiftCards] Failed to remove invalid FA gift card:",
              code,
              err
            );
          }
        }
      } catch (err) {
        console.error("[FA DEBUG initial verifyGiftCards] Call failed:", err);
      }
    })();
  }, [
    attributes,
    appliedGiftCards,
    items,
    shop,
    getSessionToken,
    applyGiftCardChange
  ]);

  const lookupHasData = Array.isArray(lastResponse?.data) && lastResponse.data.length > 0;

  const financialAidTitle = settings.financial_aid_title || "Student Billing/Financial Aid & Campus Card"


  useEffect(() => {
  const snapshot = new Set(
    (appliedGiftCards || [])
      .map(g => String(g?.lastCharacters ?? g?.code ?? '').slice(-4))
      .filter(Boolean)
  );

  if (!faVisible || !lookupHasData || !studentId) {
    prevAppliedLast4Ref.current = snapshot;
    return;
  }

  const current = snapshot;
  const prev = prevAppliedLast4Ref.current || new Set();

  const faLast4 = new Set(
    Object.values(appliedByFA || {})
      .map(v => String(v?.code || '').slice(-4))
      .filter(Boolean)
  );

  let addedNonFA = false;
    for (const last4 of current) {
      if (!prev.has(last4) && !faLast4.has(last4)) {
        addedNonFA = true;
        break;
      }
    }

    prevAppliedLast4Ref.current = current;

    if (addedNonFA) {
      // Check if lookup is already in progress
      if (isLookupInProgressRef.current) {
        console.log("[FA NON-FA GIFT CARD] Skipping - lookup already in progress");
        return;
      }
      
      // Debounce to prevent rapid calls
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        if (!isLookupInProgressRef.current) {
          handleLookupIdPress();
        }
      }, 400);
    }
    
    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [appliedGiftCards, faVisible, lookupHasData, studentId, appliedByFA, handleLookupIdPress]);

  const hasLoadedInitialAttributeRef = useRef(false);

  useEffect(() => {
    if (
      !instructions ||
      !instructions.attributes ||
      !instructions.attributes.canUpdateAttributes
    ) {
      return;
    }

    if (isRestoringRef.current) {
      console.log("[Follett] Skipping save while restoring");
      return;
    }

    if (isLookupInProgressRef.current) {
      console.log("[Follett] Skipping save while lookup in progress");
      return;
    }

    const hasFinancialAidData = Object.keys(appliedByFA || {}).length > 0;
    const hasCampusCardData = ccApplied && ccApplied.code;

    if (!hasFinancialAidData && !hasCampusCardData) {
      if (!hasLoadedInitialAttributeRef.current) {
        hasLoadedInitialAttributeRef.current = true;
        return;
      }
      
      return;
    }

    if (!hasLoadedInitialAttributeRef.current) {
      hasLoadedInitialAttributeRef.current = true;
    }

    const faDataById = {};
    if (lastResponse && Array.isArray(lastResponse.data)) {
      lastResponse.data.forEach((fa) => {
        const id = String(fa.record_unique_id || "");
        if (!id) return;
        faDataById[id] = fa;
      });
    }

    const financialAidEntries = Object.entries(appliedByFA || {})
      .map(([faId, info]) => {
        const code = String(info?.code || "").trim();
        if (!code) return null;

        const amountNum = Number(info?.amount || 0);
        const fa = faDataById[faId] || {};
        
        const description = String(fa.description || "");
        const major_account_id = String(fa.major_account_id || "");
        const billing_number = String(fa.billing_number || "");

        return {
          source: "financialAid",
          financialAidId: faId,
          description,
          major_account_id,
          billing_number,
          code,
          last4: code.slice(-4),
          amount: Number.isFinite(amountNum) ? amountNum : 0,
          studentId: studentId || ""
        };
      })
      .filter(Boolean);

    const campusCardEntries = [];
    if (ccApplied?.code) {
      const code = String(ccApplied.code).trim();
      const amountNum = Number(ccApplied.amount || 0);

      campusCardEntries.push({
        source: "campusCard",
        code,
        last4: code.slice(-4),
        amount: Number.isFinite(amountNum) ? amountNum : 0
      });
    }

    const entries = financialAidEntries.concat(campusCardEntries);
    const nextValue = JSON.stringify(entries);

    const existingAttr = (attributes || []).find(
      (attr) => attr.key === "follett_giftcards"
    );
    const currentValue = existingAttr ? String(existingAttr.value || "") : "";

    if (nextValue === currentValue) {
      console.log("[Follett] Attribute unchanged, skipping save");
      return;
    }

    console.log("[Follett] Saving attribute with", entries.length, "entries:", nextValue);

    (async () => {
      try {
        const result = await applyAttributeChange({
          type: "updateAttribute",
          key: "follett_giftcards",
          value: nextValue,
        });

        if (result?.type === "error") {
          console.error(
            "[Follett] Failed to update follett_giftcards attribute:",
            result.message
          );
        } else {
          console.log("[Follett] ✅ Successfully saved follett_giftcards attribute");
        }
      } catch (err) {
        console.error(
          "[Follett] Error calling applyAttributeChange for follett_giftcards:",
          err
        );
      }
    })();
  }, [
    appliedByFA,
    ccApplied,
    attributes,
    applyAttributeChange,
    instructions,
    lastResponse,
    studentId
  ]);

  // Detect checkout restart and remove all applied gift cards
  const hasRunCheckoutCleanupRef = useRef(false);

  // Detect checkout price change event
  const lastAppliedTotalRef = useRef(null);

  useEffect(() => {
    // Only run once per checkout session
    if (hasRunCheckoutCleanupRef.current) {
      return;
    }

    // Check if there are applied gift cards from follett
    const faAttr = (attributes || []).find(attr => attr.key === 'follett_giftcards');
    
    if (!faAttr?.value) {
      hasRunCheckoutCleanupRef.current = true;
      return;
    }

    let storedEntries = [];
    try {
      const parsed = JSON.parse(String(faAttr.value));
      if (Array.isArray(parsed)) {
        storedEntries = parsed;
      }
    } catch (e) {
      storedEntries = [];
    }

    // If there are stored entries, we need to clean them up
    if (storedEntries.length > 0) {
      console.log("[CHECKOUT CLEANUP] Detected stored gift cards, removing...", storedEntries);
      
      (async () => {
        try {
          // Remove all applied gift cards from checkout
          const appliedCodes = (appliedGiftCards || [])
            .map(g => String(g?.code ?? g?.lastCharacters ?? '').trim())
            .filter(Boolean);

          for (const code of appliedCodes) {
            try {
              await applyGiftCardChange({ type: 'removeGiftCard', code });
              console.log("[CHECKOUT CLEANUP] Removed gift card from checkout:", code);
            } catch (err) {
              console.error("[CHECKOUT CLEANUP] Failed to remove gift card:", code, err);
            }
          }

          // Call backend to invalidate each stored gift card
          for (const entry of storedEntries) {
            if (entry.source === 'financialAid') {
              try {
                const token = await getSessionToken();
                await fetch(
                  `${financialAidURL}/api/financial-aid/remove-giftcard`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Accept: "application/json",
                      "Shopify-Session-Token": token,
                    },
                    body: JSON.stringify({
                      student_id: entry.studentId || "",
                      customer_id: customer?.id || "",
                      customer_email: effectiveEmail,
                      shop_domain: shop?.myshopifyDomain || "",
                      financial_aid_type: financialAidType,
                      epay_store_id: storeId,
                      major_account_id: entry.major_account_id || "",
                      billing_number: entry.billing_number || "",
                      record_unique_id: entry.financialAidId || "",
                      gift_card_code: entry.code || "",
                    }),
                  }
                );
                console.log("[CHECKOUT CLEANUP] Backend removal called for FA:", entry.code);
              } catch (err) {
                console.error("[CHECKOUT CLEANUP] Failed to call backend removal:", err);
              }
            }
          }

          // Clear the attribute
          await applyAttributeChange({
            type: "updateAttribute",
            key: "follett_giftcards",
            value: "[]",
          });
          
          console.log("[CHECKOUT CLEANUP] ✅ Cleanup completed");
          
        } catch (err) {
          console.error("[CHECKOUT CLEANUP] Error during cleanup:", err);
        } finally {
          hasRunCheckoutCleanupRef.current = true;
        }
      })();
    } else {
      hasRunCheckoutCleanupRef.current = true;
    }
  }, [
    attributes,
    appliedGiftCards,
    applyGiftCardChange,
    applyAttributeChange,
    customer,
    effectiveEmail,
    shop,
    financialAidType,
    storeId,
    getSessionToken
  ]);

  const handleTotalChangeRemoveAndLookup = useCallback(async () => {
    
    if (isLookupInProgressRef.current) {
      return;
    }
    
    try {
      setLoading(true);
      
      const faEntries = Object.entries(appliedByFA);
      
      if (faEntries.length === 0) {
        return;
      }
      
      for (const [faId, applied] of faEntries) {
        const faObj = Array.isArray(lastResponse?.data)
          ? lastResponse.data.find((fa) => String(fa.record_unique_id) === String(faId))
          : null;
        
        if (!faObj || !applied?.code) continue;
        
        try {
          const token = await getSessionToken();
          await fetch(`${financialAidURL}/api/financial-aid/remove-giftcard`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Shopify-Session-Token": token,
            },
            body: JSON.stringify({
              student_id: studentId || "",
              customer_id: customer?.id || "",
              customer_email: effectiveEmail,
              shop_domain: shop?.myshopifyDomain || "",
              financial_aid_type: financialAidType,
              epay_store_id: storeId,
              major_account_id: String(faObj?.major_account_id || ""),
              billing_number: String(faObj?.billing_number || ""),
              record_unique_id: String(faId),
              gift_card_code: String(applied.code || ""),
            }),
          });
          
        } catch (err) {
          console.error(err);
        }
        
        try {
          await applyGiftCardChange({ type: "removeGiftCard", code: applied.code });
        } catch (err) {
          console.error(err);
        }
      }
      
      setAppliedByFA({});
      setAmountByFA({});
      
      try {
        await applyAttributeChange({
          type: "updateAttribute",
          key: "follett_giftcards",
          value: "[]",
        });
      } catch (err) {
        console.error(err);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      lastAppliedTotalRef.current = null;
      
      await handleLookupIdPress();
      
    } catch (error) {
      setLastError("Error while trying to update values.");
    } finally {
      setLoading(false);
    }
  }, [
    appliedByFA,
    lastResponse,
    studentId,
    customer,
    effectiveEmail,
    shop,
    financialAidType,
    storeId,
    getSessionToken,
    applyGiftCardChange,
    applyAttributeChange,
    handleLookupIdPress
  ]);

  useEffect(() => {
    if (!faVisible || !lookupHasData || Object.keys(appliedByFA).length === 0) {
      return;
    }
    
    if (lastAppliedTotalRef.current === null) {
      return;
    }
    
    const currentTotal = Number(totalAmount?.amount ?? 0);
    const savedTotal = Number(lastAppliedTotalRef.current);
    
    const difference = Math.abs(currentTotal - savedTotal);
    const percentDiff = savedTotal > 0 ? (difference / savedTotal) * 100 : 0;
    
    if (difference > 0.01 && percentDiff > 1) {
      console.log({
        savedTotal,
        currentTotal,
        difference,
        percentDiff: `${percentDiff.toFixed(2)}%`
      });
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        handleTotalChangeRemoveAndLookup();
      }, 500); // 500ms debounce
    }
    
    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [
    totalAmount?.amount,
    faVisible,
    lookupHasData,
    appliedByFA,
    handleTotalChangeRemoveAndLookup
  ]);

  useEffect(() => {
    if (!financialAidURL) {
      console.error('[CONFIG] financialAidURL is not available');
      setCcBalance(null);
      setCcRedeemToken(null);
      setCcApplied(null);
    }
  }, [financialAidURL]);

  return (
    <BlockStack border={"base"} padding={"base"} cornerRadius={"base"}>
      <BlockStack spacing={"none"}>
        <Heading level={2}>{financialAidTitle}</Heading>
        <Text size={"base"} appearance={"subdued"}>
          The funds will be deducted from your account once the order is processed.
        </Text>
        { hasPickup && (
          <Text size={"base"} appearance={"subdued"}>
            Please provide your billing address in the Payments section (last name, state/province, zip/postal code and phone) to proceed with account lookup.
          </Text>
        ) }
      </BlockStack>

      <BlockStack spacing="base">
        <Text size={"base"} emphasis={"bold"}>
          Select a payment(s)
        </Text>

        <BlockStack spacing={"tight"}>
          <Checkbox id="fa-checkbox" name="fa-checkbox" checked={faVisible} onChange={setFaVisible}>
            {shop.myshopifyDomain.includes("0930") || shop.myshopifyDomain.includes("9965")
              ? "Financial Aid / Sponsorship"
              : "Financial Aid / Scholarship"}
          </Checkbox>

          {faVisible && !lookupHasData && !sso && (
            <BlockStack
              background="subdued"
              cornerRadius="base"
              padding="base"
              spacing="base"
            >
              <InlineLayout columns={lookupColumns} spacing="base">
                <TextField
                  label={studentIdLabel}
                  accessibilityDescription={studentIdLabel}
                  id="student-id"
                  multiline={false}
                  disabled={false}
                  onChange={setStudentId}
                  value={studentId}
                />

                {faAllowPin && (
                  <InlineLayout columns={["fill", "auto"]} spacing="tight" blockAlignment="end">
                    <TextField
                      label="Pin"
                      accessibilityDescription="Financial Aid Pin"
                      id="student-pin"
                      multiline={false}
                      disabled={false}
                      type="password"
                      onChange={setPin}
                      icon="info"
                    />
                  </InlineLayout>
                )}

                <Button
                  appearance={"info"}
                  kind="secondary"
                  accessibilityLabel="Look Up Account"
                  id="look-up-id"
                  loading={loading}
                  disabled={false}
                  onPress={handleLookupIdPress}
                >
                  LOOK UP ACCOUNT
                </Button>
              </InlineLayout>
              
              { studentFieldHelperText && (
                <InlineLayout>
                  <Text size="small" appearance="subdued">
                    {studentFieldHelperText}
                  </Text>
                </InlineLayout>
              )}

              {lastError && (
                <InlineLayout
                  columns={["auto", "fill"]}
                  blockAlignment="center"
                  spacing="base"
                >
                  <Icon appearance="critical" source="info" />
                  <Text appearance="critical">{lastError}</Text>
                </InlineLayout>
              )}
            </BlockStack>
          )}

          {faVisible && !lookupHasData && sso && (
            <>
              <InlineLayout columns={["auto", "auto"]} spacing="tight">
                <Button
                  appearance="info"
                  kind="secondary"
                  accessibilityLabel="Student"
                  pressed={isStudent}
                  disabled={isStudent}
                  onPress={() => setSelected("student")}
                >
                  <InlineLayout
                    columns={["auto", "auto"]}
                    spacing="none"
                    inlineAlignment="center"
                    blockAlignment="center"
                  >
                    {isStudent && (
                      <View padding={["none", "tight", "none", "none"]}>
                        <Icon source="checkmark" appearance="base" />
                      </View>
                    )}
                    <Text>Student</Text>
                  </InlineLayout>
                </Button>

                <Button
                  appearance="info"
                  kind="secondary"
                  accessibilityLabel="Program Manager"
                  pressed={isManager}
                  disabled={isManager}
                  onPress={() => setSelected("manager")}
                >
                  <InlineLayout
                    columns={["auto", "auto"]}
                    spacing="none"
                    inlineAlignment="center"
                    blockAlignment="center"
                  >
                    {isManager && (
                      <View padding={["none", "tight", "none", "none"]}>
                        <Icon source="checkmark" appearance="base" />
                      </View>
                    )}
                    <Text>Program Manager</Text>
                  </InlineLayout>
                </Button>
              </InlineLayout>

              {!isManager && (
                <BlockStack>
                  <InlineLayout columns={[20, "fill"]} blockAlignment="center" spacing="base">
                    <Icon source="info" appearance="subdued" />
                    <Text appearance="subdued">
                      A pop-up will prompt you to sign in with your school credentials. Make sure pop-up blockers are disabled.
                    </Text>
                  </InlineLayout>

                  <InlineLayout columns={["auto"]} inlineAlignment="start">
                    <Button appearance="accent" accessibilityLabel="Student Login">
                      LOG IN
                    </Button>
                  </InlineLayout>
                </BlockStack>
              )}

              {isManager && (
                <InlineLayout
                  background="subdued"
                  cornerRadius="base"
                  padding="base"
                  columns={["33.3%", "20%", "43.3%"]}
                  spacing="base"
                >
                  <TextField
                    label="Account Number"
                    accessibilityDescription="Account Number"
                    id="account-number"
                    multiline={false}
                    disabled={false}
                    onChange={setStudentId}
                    value={studentId}
                  />
                  <TextField
                    label="Pin"
                    accessibilityDescription="Pin"
                    id="pin"
                    multiline={false}
                    disabled={false}
                    onChange={setStudentId}
                    value={studentId}
                  />
                  <Button
                    appearance={"info"}
                    kind="secondary"
                    accessibilityLabel="Look Up Account"
                    id="look-up-id"
                    loading={loading}
                    disabled={false}
                    onPress={handleLookupIdPress}
                  >
                    LOOK UP ACCOUNT
                  </Button>
                </InlineLayout>
              )}
            </>
          )}

          {faVisible && lookupHasData && (
            <BlockStack background="subdued" cornerRadius="base" padding="base" spacing="base">

              {/* <InlineLayout columns={[24, "fill"]} blockAlignment="center" spacing="tight">
                <Image source={clipboard_pen} aspectRatio={1} fit="contain" />
                <Text>Enter how much you want to apply from each account’s eligible amount.</Text>
              </InlineLayout>

              <Divider /> */}

              {lastResponse.data.map((fa, index) => {
                const faId = String(fa.record_unique_id);
                const applied = appliedByFA[faId];
                const amountValue = amountByFA[faId] ?? "";
                const signatureMessage = (fa?.signature_message ?? "").toString().trim();
                const taxExempt = Boolean(fa?.tax_exempt);

                const restrictedSet = new Set(
                  (fa?.restricted_items ?? []).map((s) => String(s).trim().toLowerCase())
                );

                // Calcular total de itens incluindo shipping
                const cartItemsCount = (cartLines ?? []).reduce((sum, l) => sum + Number(l?.quantity ?? 0), 0);
                const shippingCount = shippingItem ? 1 : 0;
                const totalItems = cartItemsCount + shippingCount;

                // Calcular itens elegíveis incluindo shipping
                const eligibleCartItems = (cartLines ?? []).reduce((sum, l) => {
                  const sku = String(l?.merchandise?.sku ?? "").trim().toLowerCase();
                  const qty = Number(l?.quantity ?? 0);
                  return sum + (restrictedSet.has(sku) ? 0 : qty);
                }, 0);

                const shippingRestricted = shippingItem && restrictedSet.has(String(shippingItem.sku).trim().toLowerCase());
                const eligibleItems = eligibleCartItems + (shippingRestricted ? 0 : shippingCount);
                const hasEligibleInBag = eligibleItems > 0;
                const hasEligibleProducts = eligibleCartItems > 0;

                return (
                  <BlockStack key={faId} spacing="tight" padding="none">
                    <Text size={"base"} emphasis={"bold"}>
                      {fa?.description || "Financial Aid"}
                    </Text>

                    {!applied && (
                      <>
                        <Grid
                          spacing="tight"
                          inlineAlignment="start"
                          blockAlignment="center"
                          rows="auto"
                          columns={
                            Style.default(["fill", "fill"])
                              .when({ viewportInlineSize: { min: "small" } }, ["fill", "fill"])
                              .when({ viewportInlineSize: { min: "medium" } }, ["fill", "fill", "fill"])
                              .when({ viewportInlineSize: { min: "large" } }, ["fill", "fill", "fill"])
                          }
                        >
                          <GridItem columnSpan={Style.default(2).when({ viewportInlineSize: { min: "small" } }, 1)}>
                            <View padding="none">
                              <BlockStack spacing="none">
                                <InlineLayout columns={["auto", 14]} blockAlignment="center" spacing="tight">
                                  <Text size="small" appearance="subdued">Available Credit</Text>
                                  <Link
                                    overlay={
                                      <Modal
                                        id={`fa-available-credit-${faId}`}
                                        title={"AVAILABLE CREDIT"}
                                        padding
                                        cornerRadius="base"
                                      >
                                        <BlockStack spacing="base">
                                          <Text>
                                            Your available credit represents the maximum funds you can apply to this order based on your current balance. Contact your Campus Store for more information.
                                          </Text>
                                          <Divider />
                                          <InlineLayout inlineAlignment="end" columns={["fill"]}>
                                            <Button
                                              onPress={() => ui?.overlay?.close && ui.overlay.close(`fa-available-credit-${faId}`)}
                                            >
                                              CLOSE
                                            </Button>
                                          </InlineLayout>
                                        </BlockStack>
                                      </Modal>
                                    }
                                  >
                                    <Icon source="critical" aspectRatio={1} fit="contain" appearance="subdued" />
                                  </Link>
                                </InlineLayout>
                                <Text emphasis="bold">
                                  ${Number(fa?.available_balance ?? 0).toFixed(2)}
                                </Text>
                              </BlockStack>
                            </View>
                          </GridItem>

                          <GridItem>
                            <View spacing="none" padding="none">
                              <BlockStack spacing="none">
                                <InlineLayout columns={["auto", 14]} blockAlignment="center" spacing="tight">
                                  <Text size="small" appearance="subdued">Online End Date</Text>
                                  <Link
                                    overlay={
                                      <Modal
                                        id={`fa-online-end-date-${faId}`}
                                        title={"ONLINE END DATE"}
                                        padding
                                        cornerRadius="base"
                                      >
                                        <BlockStack spacing="base">
                                          <Text>
                                            An online end date is the last day to use your funds online. Contact your Campus Store for more information.
                                          </Text>
                                          <Divider />
                                          <InlineLayout inlineAlignment="end" columns={["fill"]}>
                                            <Button
                                              onPress={() => ui?.overlay?.close && ui.overlay.close(`fa-online-end-date-${faId}`)}
                                            >
                                              CLOSE
                                            </Button>
                                          </InlineLayout>
                                        </BlockStack>
                                      </Modal>
                                    }
                                  >
                                    <Icon source="critical" appearance="subdued" />
                                  </Link>
                                </InlineLayout>
                                <Text emphasis="bold">
                                  {(() => {
                                    const dateStr = String(fa?.close_date ?? "").trim();                                    
                                    if (!dateStr) {
                                      return "No End Date";
                                    }
                                    const s = dateStr.replaceAll("\\/", "/").split("/");
                                    if (s.length === 3 && s[0] && s[1] && s[2]) {
                                      return `${s[0]}/${s[1]}/${s[2].slice(-2)}`;
                                    }
                                    return "No End Date";
                                  })()}
                                </Text>
                              </BlockStack>
                            </View>
                          </GridItem>

                          <GridItem>
                            <View spacing="none" padding="none">
                              <BlockStack spacing="none">
                                <InlineLayout columns={["auto", 14]} blockAlignment="center" spacing="tight">
                                  <Text size="small" appearance="subdued">In Store End Date</Text>
                                  <Link
                                    overlay={
                                      <Modal
                                        id={`fa-instore-end-date-${faId}`}
                                        title={"IN STORE END DATE"}
                                        padding
                                        cornerRadius="base"
                                      >
                                        <BlockStack spacing="base">
                                          <Text>
                                            An in store end date is the last day to use your funds in store. Contact your Campus Store for more information.
                                          </Text>
                                          <Divider />
                                          <InlineLayout inlineAlignment="end" columns={["fill"]}>
                                            <Button
                                              onPress={() => ui?.overlay?.close && ui.overlay.close(`fa-instore-end-date-${faId}`)}
                                            >
                                              CLOSE
                                            </Button>
                                          </InlineLayout>
                                        </BlockStack>
                                      </Modal>
                                    }
                                  >
                                    <Icon source="critical" appearance="subdued" />
                                  </Link>
                                </InlineLayout>
                                <Text emphasis="bold">
                                  {(() => {
                                    const dateStr = String(fa?.close_date ?? "").trim();
                                    if (!dateStr) {
                                      return "No End Date";
                                    }
                                    const s = dateStr.replaceAll("\\/", "/").split("/");
                                    if (s.length === 3 && s[0] && s[1] && s[2]) {
                                      return `${s[0]}/${s[1]}/${s[2].slice(-2)}`;
                                    }
                                    return "No End Date";
                                  })()}
                                </Text>
                              </BlockStack>
                            </View>
                          </GridItem>

                          <GridItem>
                            <View spacing="none" padding="none">
                              <BlockStack spacing="none">
                                <Text size="small" appearance="subdued">Eligible Items In Bag</Text>
                                <InlineLayout columns={["auto", "auto"]} spacing="tight" blockAlignment="center">
                                  <Text emphasis="bold">
                                    {`${eligibleCartItems}/${cartItemsCount}`}
                                  </Text>
                                  
                                  <Link
                                    overlay={
                                      <Modal
                                        id={`eligible-details-${faId}`}
                                        title="Merchandise Restrictions"
                                        padding
                                        cornerRadius="base"
                                      >
                                        {((taxExemptParam) => {
                                          const restrictedSet = new Set(
                                            (fa?.restricted_items ?? []).map((s) => String(s).trim().toLowerCase())
                                          );

                                          const restrictedCartLines = (cartLines ?? []).filter((l) =>
                                            restrictedSet.has(String(l?.merchandise?.sku ?? "").trim().toLowerCase())
                                          );

                                          const shippingRestricted =
                                            shippingItem &&
                                            restrictedSet.has(String(shippingItem.sku).trim().toLowerCase());

                                          const restrictedLines = [...restrictedCartLines];

                                          if (shippingRestricted) {
                                            restrictedLines.push({
                                              merchandise: {
                                                product: { title: "Shipping" },
                                                title: "Shipping",
                                              },
                                              cost: {
                                                totalAmount: {
                                                  amount: shippingItem.total_price,
                                                },
                                              },
                                            });
                                          }

                                          if (restrictedLines.length === 0) {
                                            return (
                                              <BlockStack spacing="base">
                                                <Text>There are no restricted items in your bag.</Text>

                                                {taxExemptParam && (
                                                  <Text>
                                                    During processing, sales tax will not be charged for any items purchased with this account.
                                                  </Text>
                                                )}

                                                <Divider />

                                                <InlineLayout inlineAlignment="end" columns={["auto"]}>
                                                  <Button onPress={() => ui.overlay.close(`eligible-details-${faId}`)}>
                                                    CLOSE
                                                  </Button>
                                                </InlineLayout>
                                              </BlockStack>
                                            );
                                          }

                                          return (
                                            <BlockStack spacing="base">
                                              <Text>
                                                Some items in your bag cannot be purchased with this account. The following may be purchased with another form of payment.
                                              </Text>

                                              <BlockStack
                                                spacing="base"
                                                background="subdued"
                                                padding="base"
                                                cornerRadius="small"
                                              >
                                                {restrictedLines.map((l, i) => (
                                                  <InlineLayout
                                                    key={i}
                                                    columns={["fill", "auto"]}
                                                    spacing="base"
                                                    blockAlignment="start"
                                                  >
                                                    <Text emphasis="bold">
                                                      {String(
                                                        l?.merchandise?.product?.title ??
                                                          l?.merchandise?.title ??
                                                          "Restricted item"
                                                      ).toUpperCase()}
                                                    </Text>
                                                    <Text>${Number(l?.cost?.totalAmount?.amount || 0).toFixed(2)}</Text>
                                                  </InlineLayout>
                                                ))}
                                              </BlockStack>

                                              <InlineLayout inlineAlignment="end" columns={["auto"]}>
                                                <Button onPress={() => ui.overlay.close(`eligible-details-${faId}`)}>
                                                  CLOSE
                                                </Button>
                                              </InlineLayout>
                                            </BlockStack>
                                          );
                                        })(taxExempt)}
                                      </Modal>
                                    }
                                  >
                                    View Details
                                  </Link>
                                </InlineLayout>
                              </BlockStack>
                            </View>
                          </GridItem>

                          <GridItem>
                            <View spacing="none" padding="none">
                              <BlockStack spacing="none">
                                <Text size="small" appearance="subdued">Eligible Amount</Text>
                                <Text emphasis="bold">
                                  ${hasEligibleProducts ? Number(fa?.eligible_amount ?? 0).toFixed(2) : "0.00"}
                                </Text>
                              </BlockStack>
                            </View>
                          </GridItem>
                        </Grid>
                        {taxExempt && (
                          <InlineLayout columns={["auto", "fill"]} blockAlignment="center" spacing="base">
                            <Icon appearance="warning" source="info" />
                            <Text appearance="warning">
                              No tax will be charged for items paid for by this account. If you are asked to enter a 2nd payment method for tax related to these items, it will not be charged during order processing.
                            </Text>
                          </InlineLayout>
                        )}
                        {hasEligibleProducts && (
                          <Text size="small">
                            <Link
                              overlay={
                                <Modal
                                  id="my-modal"
                                  padding
                                  title="Review Terms & Conditions"
                                >
                                  <BlockStack>
                                    <InlineLayout>
                                      <Text>
                                        {signatureMessage || "Terms & conditions are not available for this account."}
                                      </Text>
                                    </InlineLayout>
                                    <Divider></Divider>
                                    <InlineLayout columns={["79"]} inlineAlignment="end">
                                      <Button
                                      onPress={() =>
                                        ui.overlay.close('my-modal')
                                      }
                                      >
                                        CLOSE
                                      </Button>
                                    </InlineLayout>
                                  </BlockStack>
                                </Modal>
                              }
                            >
                              Review Terms & Conditions
                            </Link>{" "}
                          for this account.</Text>
                        )}
                      </>
                    )}

                    {applied ? (
                      <BlockStack spacing="tight">
                        <InlineLayout columns={[14, "fill"]} blockAlignment="center" spacing="tight">
                          <Image
                            source={circle_check_filled}
                            aspectRatio={1}
                            fit="contain"
                            accessibilityDescription="Applied"
                          />
                          <Text appearance="subdued">
                            ${Number(applied.amount).toFixed(2)} applied to your order
                          </Text>
                        </InlineLayout>
                        <InlineLayout
                          inlineAlignment="start"
                          blockAlignment="center"
                          columns={["auto", "auto", "auto"]}
                          spacing="tight"
                        >
                          {/* <Link onPress={() => handleEditFundsPress(fa)}>Edit</Link>
                          <Text>|</Text> */}
                          <Link onPress={() => handleRemoveFundsPress(fa)}>Remove</Link>
                        </InlineLayout>
                      </BlockStack>
                    ) : (
                      <BlockStack padding="none" spacing="tight">
                        {!hasEligibleProducts && (
                          <InlineLayout columns={["auto", "fill"]} blockAlignment="center" spacing="base">
                            <Icon appearance="critical" source="info" />
                            <Text appearance="critical">
                              {"We're sorry, the payment method you've selected can't be used for the item(s) in your shopping bag. Please choose another form of payment."}
                            </Text>
                          </InlineLayout>
                        )}

                        {errorByFA[faId] && (
                          <InlineLayout columns={["auto", "fill"]} blockAlignment="center" spacing="base">
                            <Icon appearance="critical" source="info" />
                            <Text appearance="critical">{errorByFA[faId]}</Text>
                          </InlineLayout>
                        )}

                        {hasEligibleProducts && (
                          <InlineLayout padding="none" spacing="tight" columns={["auto"]}>
                            <Button
                              appearance={"base"}
                              accessibilityLabel="Apply Funds"
                              id={`apply-funds-${faId}`}
                              loading={!!loadingByFA[faId]}
                              disabled={!!loadingByFA[faId]}
                              onPress={() => handleApplyFundsPress(fa)}
                            >
                              APPLY FUNDS
                            </Button>
                          </InlineLayout>
                        )}

                      </BlockStack>
                    )}

                    {index !== lastResponse.data.length - 1 && <Divider />}
                  </BlockStack>
                );
              })}

              <Modal
                id="fa-restrictions-modal"
                title="Merchandise Restrictions"
                onClose={() => {
                  setRestrictionsOpen(false);
                }}
              >
                <BlockStack padding="base" spacing="base">
                  <Text>
                    Item(s) in your bag can't be purchased with this account and
                    another form of payment will need to be used.
                  </Text>

                  <View background="subdued" cornerRadius="base" padding="base">
                    <BlockStack spacing="loose">
                      {restrictionLines.map((line, i) => (
                        <BlockStack key={i} spacing="none">
                          <Text emphasis="bold">{String(line.title || "").toUpperCase()}</Text>
                          <Text>${Number(line.amount || 0).toFixed(2)}</Text>
                        </BlockStack>
                      ))}
                    </BlockStack>
                  </View>

                  <InlineLayout inlineAlignment="end" columns={["auto"]}>
                    <Button
                      appearance="accent"
                      onPress={() => {
                        setRestrictionsOpen(false);
                        if (ui?.overlay?.close) ui.overlay.close("fa-restrictions-modal");
                      }}
                    >
                      CLOSE
                    </Button>
                  </InlineLayout>
                </BlockStack>
              </Modal>
            </BlockStack>
          )}

          <Checkbox
            id="cc-checkbox"
            name="cc-checkbox"
            checked={ccVisible}
            onChange={setCcVisible}
          >
            Campus Card
          </Checkbox>

          {ccVisible && ccBalance == null && !ccApplied && !ccRedeemLoading && (
            <BlockStack background="subdued" cornerRadius="base" padding="base" spacing="base">
              <InlineLayout columns={lookupColumns} spacing="base">
                <TextField
                  label="Campus Card"
                  accessibilityDescription="Campus Card Number"
                  id="campus-card-no"
                  multiline={false}
                  disabled={false}
                  onChange={setCcCardNo}
                  value={ccCardNo}
                />

                {faAllowPin && (
                  <TextField
                    label="PIN"
                    accessibilityDescription="Campus Card PIN"
                    id="campus-card-pin"
                    multiline={false}
                    disabled={false}
                    type="password"
                    onChange={setCcPin}
                    value={ccPin}
                  />
                )}

                <Button
                  appearance="info"
                  kind="secondary"
                  accessibilityLabel="Look Up Balance"
                  id="look-up-cc"
                  loading={ccLoading}
                  disabled={ccLoading}
                  onPress={handleLookupCCPress}
                >
                  LOOK UP BALANCE
                </Button>
              </InlineLayout>

              {ccError && (
                <InlineLayout columns={["auto", "fill"]} blockAlignment="center" spacing="base">
                  <Icon appearance="critical" source="info" />
                  <Text appearance="critical">{ccError}</Text>
                </InlineLayout>
              )}
            </BlockStack>
          )}

          {ccVisible && ccRedeemLoading && !ccApplied && (
            <BlockStack background="subdued" cornerRadius="base" padding="base" spacing="base">
              <InlineLayout columns={["auto", "fill"]} blockAlignment="center" spacing="base">
                <Icon source="spinner" />
                <Text>Processing Campus Card payment...</Text>
              </InlineLayout>

              {ccRedeemError && (
                <InlineLayout columns={["auto", "fill"]} blockAlignment="center" spacing="base">
                  <Icon appearance="critical" source="info" />
                  <Text appearance="critical">{ccRedeemError}</Text>
                </InlineLayout>
              )}
            </BlockStack>
          )}

          {ccVisible && ccBalance != null && !ccApplied && !ccRedeemLoading && (
            <BlockStack background="subdued" cornerRadius="base" padding="base" spacing="base">
              <Text size="base" emphasis="bold">
                Available balance: ${Number(ccBalance).toFixed(2)}
              </Text>

              <InlineLayout columns={["50%", "fill"]} spacing="base">
                <TextField
                  label="Amount to Apply"
                  accessibilityDescription="Amount to apply from Campus Card"
                  id="campus-card-amount"
                  multiline={false}
                  disabled={false}
                  onChange={setCcAmount}
                  value={ccAmount}
                  type="number"
                  icon="cashDollar"
                />
                <Button
                  appearance="base"
                  accessibilityLabel="Apply"
                  id="generate-cc"
                  loading={ccRedeemLoading}
                  disabled={ccRedeemLoading}
                  onPress={handleGenerateCCPress}
                >
                  APPLY
                </Button>
              </InlineLayout>

              {ccRedeemError && (
                <InlineLayout columns={["auto", "fill"]} blockAlignment="center" spacing="base">
                  <Icon appearance="critical" source="info" />
                  <Text appearance="critical">{ccRedeemError}</Text>
                </InlineLayout>
              )}
            </BlockStack>
          )}

          {ccVisible && ccApplied && (
            <BlockStack background="subdued" cornerRadius="base" padding="base" spacing="base">
              <InlineLayout columns={[14, "fill"]} blockAlignment="center" spacing="tight">
                <Image
                  source={circle_check_filled}
                  aspectRatio={1}
                  fit="contain"
                  accessibilityDescription="Applied"
                />
                <Text appearance="subdued">
                  ${Number(ccApplied.amount).toFixed(2)} applied to your order
                </Text>
              </InlineLayout>
            </BlockStack>
          )}
          
        </BlockStack>
      </BlockStack>
    </BlockStack>
  );
}