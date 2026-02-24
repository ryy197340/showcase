// gtmEvents.ts PEAK ACTIVITY Ashwani Bhasin

import { sha1, sha256, stripGlobalId } from '.';

import Index from "~/routes/($lang)._index";

const generateRandomId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
const eventId = generateRandomId();
// Updated guard timing to resolve firing conflicts
const setGuardWithTimeout = (key, timeout) => {
  localStorage.setItem(key, 'true');
  setTimeout(() => {
    localStorage.removeItem(key);
  }, timeout);
};

// Function for robust timing checks
const isGuardActive = (key) => {
  return localStorage.getItem(key) === 'true';
};

const getElevarProductsFromCart = (cart) => {
  if (!cart) return [];

  /** Products Array - Was used by Elevar in dl_user_Data**/
  return cart.lines.edges.map((edge, index) => {
    const line = edge.node;
    return {
      id: line.merchandise.sku,
      name: line.merchandise.product.title,
      brand: 'J. McLaughlin',
      category: '',
      variant: line.merchandise.title,
      price: line.merchandise.price.amount,
      quantity: line.quantity.toString(),
      position: index + 1,
      list: '', // The list the product was discovered from
      product_id: stripGlobalId(line.merchandise.product.id),
      variant_id: stripGlobalId(line.merchandise.id),
      compare_at_price: line.merchandise.compareAtPrice?.amount || '0.0',
      image: line.merchandise?.image?.url || '',
      url: `/products/${line.merchandise.product.handle}`,
    };
  });
};

// Determine content type based on page route
const determineContentGroup = (pathname) => {
  // Remove language prefix if it exists (e.g., /en-br/)
  const normalizedPath = pathname.replace(/^\/[a-z]{2}-[a-z]{2}\//, "/");

  if (normalizedPath.startsWith("/products")) {
    return "Product Detail";
  } else if (normalizedPath.startsWith("/collections")) {
    return "Product Listing";
  } else if (normalizedPath === "/cart") {
    return "Cart";
  } else if (normalizedPath.startsWith("/search")) {
    return "Search Results";
  } else if (normalizedPath.startsWith("/account")) {
    return "Account";
  } else if (normalizedPath.startsWith("/pages/contact-us")) {
    return "Contact Us";
  } else if (normalizedPath.startsWith("/blog")) {
    return "Blog";
  } else if (normalizedPath.startsWith("/pages")) {
    return "Company Pages";
  } else if (normalizedPath === "/") {
    return "Home";
  } else {
    return "Other";
  }
};

// Get User Data from Customer Object if available or check the gtm_user_data cookie values and extract from there. gtm_user_data is set in customer_events

// Helper function to get a cookie
const getCookie = (name: string): string | undefined => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || undefined;
  return undefined;
};

// Get User Properties
const getUserProperties = (customer) => {
  const userProperties: Record<string, any> = {
    user_consent: '', // Use an empty string
    visitor_type: 'guest', // Default to "guest"
    customer_first_name: undefined,
    customer_last_name: undefined,
    customer_email: undefined,
    customer_phone: undefined,
    customer_address_1: undefined,
    customer_city: undefined,
    customer_province: undefined,
    customer_zip: undefined,
    customer_country: undefined,
    customer_id: undefined,
  };

  if (customer) {
    // If the customer object is available (signed-in user), populate userProperties
    userProperties.customer_first_name = customer?.firstName || undefined;
    userProperties.customer_last_name = customer?.lastName || undefined;
    userProperties.customer_email = customer?.email || undefined;
    userProperties.customer_phone = customer?.phone || undefined;
    userProperties.customer_address_1 = customer?.defaultAddress?.address1 || undefined;
    userProperties.customer_city = customer?.defaultAddress?.city || undefined;
    userProperties.customer_province = customer?.defaultAddress?.province || undefined;
    userProperties.customer_zip = customer?.defaultAddress?.zip || undefined;
    userProperties.customer_country = customer?.defaultAddress?.country || undefined;
    userProperties.customer_id = customer?.id ? stripGlobalId(customer.id) : undefined;

    userProperties.visitor_type = 'logged_in'; // Update visitor type
  } else {
    // Check if gtm_user_data cookie exists
    const cookieData = getCookie('gtm_user_data');
    if (cookieData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(cookieData));

        // Map cookie fields to userProperties
        userProperties.customer_first_name = parsedData.fn || undefined;
        userProperties.customer_last_name = parsedData.ln || undefined;
        userProperties.customer_email = parsedData.em || undefined;
        userProperties.customer_phone = parsedData.ph || undefined;
        userProperties.customer_address_1 = parsedData.street || undefined;
        userProperties.customer_city = parsedData.ct || undefined;
        userProperties.customer_province = parsedData.st || undefined;
        userProperties.customer_zip = parsedData.zp || undefined;
        userProperties.customer_country = parsedData.country || undefined;
        userProperties.customer_id = parsedData.userId || undefined;
      } catch (error) {
        console.error('Error parsing gtm_user_data cookie:', error);
      }
    }
  }

  return userProperties;
};
/*
// The majority of this information can only be retrieved for a logged in user
const getUserProperties = (customer) => {
  const userProperties: {
    user_consent: string;
    visitor_type: string;
    customer_address_1?: string | null;
    customer_address_2?: string | null;
    customer_city?: string | null;
    customer_country?: string | null;
    customer_email?: string | null;
    customer_first_name?: string | null;
    customer_id?: string | null;
    customer_last_name?: string | null;
    customer_order_count?: string | null;
    customer_phone?: string | null;
    customer_province?: string | null;
    customer_tags?: string | null;
    customer_total_spent?: string | null;
    customer_zip?: string | null;
  } = {
    user_consent: '', // Use an empty string
    visitor_type: 'guest', // "logged_in" || "guest"
  };

  if (customer) {
    // The following fields aren't required if unavailable
    userProperties.customer_address_1 = customer?.defaultAddress?.address1 || undefined;
    userProperties.customer_address_2 = customer?.defaultAddress?.address2 || undefined;
    userProperties.customer_city = customer?.defaultAddress?.city || undefined;
    userProperties.customer_country = customer?.defaultAddress?.country || undefined;
    userProperties.customer_email = customer?.email || undefined;
    userProperties.customer_first_name = customer?.firstName || undefined;
    userProperties.customer_id = customer?.id ? stripGlobalId(customer.id) : undefined;
    userProperties.customer_last_name = customer?.lastName || undefined;
    userProperties.customer_order_count = customer?.orders?.edges
      ? customer.orders.edges.length.toString()
      : undefined;
    userProperties.customer_phone = customer?.phone || undefined;
    userProperties.customer_province = customer?.defaultAddress?.province || undefined;
    userProperties.customer_tags = undefined;
    userProperties.customer_total_spent = customer?.orders?.edges
      ? customer.orders.edges
        .reduce(
          (acc, order) =>
            acc + (parseFloat(order?.node?.currentTotalPrice?.amount) || 0),
          0,
        )
        .toString()
      : undefined;
    userProperties.customer_zip = customer?.defaultAddress?.zip || undefined;

    // The following fields are required
    userProperties.user_consent = ''; // Use an empty string
    userProperties.visitor_type = 'logged_in'; // "logged_in" || "guest"
  }

  return userProperties;
};
*/
// Helper function to retrieve currency code from LocalStorage
export const getGlobalCurrencyCode = () => {
  try {
    const localeData = JSON.parse(localStorage.getItem('locale'));
    return localeData?.currency || 'USD'; // Default to 'USD' if not found
  } catch (error) {
    console.warn('Error retrieving currency from Locale:', error);
    return 'USD'; // Default to 'USD' on error
  }
};

// Helper function to retrieve coupon code from LocalStorage
const getDiscountCodes = () => {
  const storedDiscountCodes = JSON.parse(localStorage.getItem('appliedDiscountCodes') || '[]');
  return storedDiscountCodes.length > 0 ? storedDiscountCodes.join(', ') : undefined;
};


/** Elevar Base Data Layer **/
// Should be fired before all other events and on virtual page change
// This code will push the page_loaded event when the customer has selected some filters on the collection page. The routePath and change is being tracked from root.tsx
// Track the last full route (path + query parameters) globally
/*
let lastTrackedRoute = '';

export const pushUserDataNew = async (routePath, cart, customer, currencyCode = 'USD') => {
  if (typeof window === undefined) return; // Ensure browser context

  window.ElevarDataLayer = window.ElevarDataLayer || [];

  // Full path with query parameters to handle filter changes
  const fullRoutePath = window.location.pathname + window.location.search;

  // If the current route has already been tracked, skip it
  if (fullRoutePath === lastTrackedRoute) {
    console.log("dl_user_details event has already been pushed for this route, skipping:", fullRoutePath);
    return;
  }

  // Update last tracked route
  //console.log("Pushing dl_user_details event for new route:", fullRoutePath);
  lastTrackedRoute = fullRoutePath;

  const contentGroup = determineContentGroup(routePath);
  const eventId = generateRandomId();

  const userDetails = {
    cart_total: getCartTotal(cart),
    user_properties: getUserProperties(customer),
    ecommerce: {
      currencyCode,
      cart_contents: {
        products: getElevarProductsFromCart(cart),
      },
    },
    //environment,
    event_id: eventId,
  };

  // Clear previous page details and push the new event
  window.ElevarDataLayer.push({ ecommerce: null });
  window.ElevarDataLayer.push({
    event: 'dl_user_details_ORIGINAL',
    ...userDetails,
  });

  console.log('dl_user_details_Original event pushed successfully:', userDetails);
};
*/

// Function to push page_loaded event to dataLayer. Update: dl_page_loaded event changed to dl_user_data event now. firing below
// This code will push the page_loaded event when the customer has selected some filters on the collection page. The routePath and change is being tracked from root.tsx
// Track the last full route (path + query parameters) globally

let lastTrackedRoutePL = ''; //enable when using coding below

export const pushPageLoadedEvent = async (routePath, customer, environment = "Staging", cart, currencyCode = 'USD') => {

  if (typeof window === undefined) return; // Ensure browser context

  window.ElevarDataLayer = window.ElevarDataLayer || [];

  // Full path with query parameters to handle filter changes
  const fullRoutePath = window.location.pathname + window.location.search;

  // If the current route has already been tracked, skip it
  if (fullRoutePath === lastTrackedRoutePL) {
    //console.log("page_loaded event has already been pushed for this route, skipping:", fullRoutePath);
    return;
  }

  // Update last tracked route
  //console.log("Pushing page_loaded event for new route:", fullRoutePath);
  lastTrackedRoutePL = fullRoutePath;

  const contentGroup = determineContentGroup(routePath);
  const eventId = generateRandomId();

  // Build the page_details object, using only the base path for `page_path`
  const pageDetails = {
    //environment,
    page_path: routePath, // Base path without query parameters
    page: fullRoutePath,  // Full URL with query parameters
    content_group: contentGroup,
    event_id: eventId,
    user_details: {
      //log_state: getUserProperties(customer)?.visitor_type,
      //user_id: getUserProperties(customer)?.customer_id,
      //total_spent: getUserProperties(customer)?.customer_total_spent,
      //order_count: getUserProperties(customer)?.customer_order_count,
      //customer_id: getUserProperties(customer)?.customer_id,

      enhanced_conversion: {
        email: getUserProperties(customer)?.customer_email,
        phone_number: getUserProperties(customer)?.customer_phone,
        first_name: getUserProperties(customer)?.customer_first_name,
        last_name: getUserProperties(customer)?.customer_last_name,
        street: getUserProperties(customer)?.customer_address_1,
        city: getUserProperties(customer)?.customer_city,
        state: getUserProperties(customer)?.customer_province,
        zip_code: getUserProperties(customer)?.customer_zip,
        country: getUserProperties(customer)?.customer_country
      },



    }
  };

  // Clear previous page details and push the new event
  window.ElevarDataLayer.push({ page_details: null, cart_contents: null });
  window.ElevarDataLayer.push({
    event: 'dl_user_data',
    page_details: pageDetails,
    user_properties: getUserProperties(customer),
    cart_contents: {
      cart_total: getCartTotal(cart),
      currency: "USD",
      items: getProductsFromCart(cart),
    },
  });

  //console.log('page_loaded event pushed to dataLayer successfully:', pageDetails);

};

// Fire Event on Navigation Menu Click
// Flag to prevent duplicate events
let isProcessingClick = false;
export const handleGtmClick = (): void => {
  //console.log("Initializing handleGtmClick...");

  const detectNavigationClick = (event: MouseEvent) => {
    if (isProcessingClick) {
      //console.log("Ignoring duplicate click event.");
      return;
    }
    const target = event.target as HTMLElement;

    if (!target) {
      //console.log("No target element found");
      return;
    }

    //console.log("Clicked Target:", target);

    // Detect if the click is on a button (submenus on mobile)
    if (target.tagName === "BUTTON" && target.getAttribute("aria-haspopup") === "menu") {
      //console.log("Ignoring button click for submenu toggle on mobile.");
      return;
    }

    // Detect Level 1 from parent with class `level1-item`
    const level1Element = target.closest(".level1-item");
    const level1 = level1Element?.getAttribute("data-level1") || undefined;

    // Detect Level 2 from the clicked element or its parents with class `linkTextNavigation`
    const level2Element = target.closest(".linkTextNavigation");
    const level2 = level2Element?.textContent?.trim() || undefined;

    // Desktop: Allow clicks on Level 1 (links inside `level1-item`)
    if (level1Element && !level2Element) {
      //console.log("Desktop Level 1 navigation detected:", { level1, level2: undefined });
      pushNavigationEvent(level1, undefined);
      return;
    }

    // Mobile or Desktop: Only process Level 2 links
    if (level2Element) {
      //console.log("Navigation click detected:", { level1, level2 });
      pushNavigationEvent(level1, level2);
      return;
    }

    //console.log("Not a navigation click, ignoring.");
  };
  document.addEventListener("click", detectNavigationClick, true);

};

export const pushNavigationEvent = (level1: string, level2: string): void => {
  if (isProcessingClick) {
    //console.log("Duplicate event detected, ignoring.");
    return;
  }
  // console.log("Attempting to push Navigation Event:", { level1, level2 });
  isProcessingClick = true; // Set flag to true
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ navigation_details: null });
  window.dataLayer.push({
    event: "select_navigation_menu",
    navigation_details: {
    navigation_level1: level1,
      navigation_level2: level2,
    },
  });
  //console.log("Navigation Event pushed to dataLayer:", window.dataLayer);

  // Reset flag after a short delay
  setTimeout(() => {
    isProcessingClick = false;
  }, 3000); // Adjust the delay as needed if another event is added in future
};


















/** Customer creates new account **/
// If your users don’t typically sign up this event is not required
export const pushSignUpDataNew = (customer) => {
  const eventId = generateRandomId();
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  window.ElevarDataLayer.push({
    event: 'dl_sign_up',
    ecommerce: {
      event_details: {
        event_id: eventId,
        content_group: "Account"
      },
      user_details: {
        log_state: getUserProperties(customer)?.visitor_type,
        //user_id: getUserProperties(customer)?.customer_id,
        total_spent: getUserProperties(customer)?.customer_total_spent,
        order_count: getUserProperties(customer)?.customer_order_count,
        customer_id: getUserProperties(customer)?.customer_id,
      },
      enhanced_conversion: {
        email: getUserProperties(customer)?.customer_email,
        phone_number: getUserProperties(customer)?.customer_phone,
        first_name: getUserProperties(customer)?.customer_first_name,
        last_name: getUserProperties(customer)?.customer_last_name,
        street: getUserProperties(customer)?.customer_address_1,
        city: getUserProperties(customer)?.customer_city,
        state: getUserProperties(customer)?.customer_province,
        zip_code: getUserProperties(customer)?.customer_zip,
        country: getUserProperties(customer)?.customer_country
      }
    }
  });
};

/** Customer Logs into their account **/ 
export const pushLoginDataNew = (customer) => {
  const eventId = generateRandomId();
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  window.ElevarDataLayer.push({
    event: 'dl_login',
    ecommerce: {
      event_details: {
        event_id: eventId,
        content_group: "Account"
      },
      user_details: {
        log_state: getUserProperties(customer)?.visitor_type,
        //user_id: getUserProperties(customer)?.customer_id,
        total_spent: getUserProperties(customer)?.customer_total_spent,
        order_count: getUserProperties(customer)?.customer_order_count,
        customer_id: getUserProperties(customer)?.customer_id,
      },
      enhanced_conversion: {
        email: getUserProperties(customer)?.customer_email,
        phone_number: getUserProperties(customer)?.customer_phone,
        first_name: getUserProperties(customer)?.customer_first_name,
        last_name: getUserProperties(customer)?.customer_last_name,
        street: getUserProperties(customer)?.customer_address_1,
        city: getUserProperties(customer)?.customer_city,
        state: getUserProperties(customer)?.customer_province,
        zip_code: getUserProperties(customer)?.customer_zip,
        country: getUserProperties(customer)?.customer_country
      }
    }
  });
};

// Define categorization rules for each level, Thank You Joe Cardon
const categoryRules = [
  { // Product Type
    level: "item_category",
    options: [
      // Tops
      { name: "Dresses", keywords: ["Dress", "Gown"] },
      { name: "Shirts & Tops", keywords: ["Top", "Shirt", "Blouse", "Tee", "Polo", "1/4 Zip"] },
      { name: "Jackets & Outerwear", keywords: ["Jacket", "Blazer", "Coat", "Poncho", "Cape", "Vest"] },
      { name: "Sweaters", keywords: ["Sweater", "Cardigan", "Pullover", "Henley", "Turtleneck"] },
      // Bottoms
      { name: "Pants", keywords: ["Pants", "Jeans", "Chino"] },
      { name: "Leggings", keywords: ["Legging", "Leggings"] },
      { name: "Shorts", keywords: ["Shorts"] },
      { name: "Skirts & Skorts", keywords: ["Skirt", "Skort"] },
      { name: "Swimwear", keywords: ["Swim Trunks", "Bikini", "Tankini", "Cover Up", "Swimsuit"] },
      { name: "Jumpsuits", keywords: ["Jumpsuit"] },
      // Accessories 
      { name: "Shoes", keywords: ["Boots", "Boot", "Loafers", "Sneakers", "Heels", "Espadrilles", "Flats", "Slingback", "Driving Moccasins"] },
      { name: "Bags", keywords: ["Handbag", "Crossbody", "Bucket Bag", "Clutch", "Tote", "Belt Bag", "Cosmetic Bag"] },
      { name: "Scarves", keywords: ["Scarf", "Wrap", "Neckwarmer", "Snood"] },
      { name: "Hats", keywords: ["Hat", "Beanie"] },
      { name: "Gloves", keywords: ["Gloves"] },
      { name: "Jumpsuits", keywords: ["Jumpsuit"] },
      { name: "Gift Cards", keywords: ["Gift Card"] },
      { name: "Belts", keywords: ["Belt"] },
      { name: "Eyewear", keywords: ["Readers", "Sunglasses", "Glasses", "glasses"] },
      { name: "Socks", keywords: ["Socks"] },
      { name: "Pocket Square", keywords: ["Pocket Square"] },
      { name: "Tie", keywords: ["Tie"] },
      { name: "Wallet", keywords: ["Wallet"] },
    ]
  },
  { // Material and/or Fit
    level: "item_category2",
    options: [
      // Materials
      { name: "Cashmere", keywords: ["Cashmere"] },
      { name: "Suede", keywords: ["Suede"] },
      { name: "Leather", keywords: ["Leather", "Vegan Leather", "Faux Leather"] },
      { name: "Silk", keywords: ["Silk"] },
      { name: "Velvet", keywords: ["Velvet"] },
      { name: "Jacquard", keywords: ["Jacquard"] },
      { name: "Corduroy", keywords: ["Corduroy"] },
      { name: "Wool", keywords: ["Wool", "Alpaca"] },
      { name: "Fringe", keywords: ["Fringe"] },
      { name: "Raffia", keywords: ["Raffia"] },
      { name: "Tweed", keywords: ["Tweed"] },
      { name: "Metallic", keywords: ["Metallic"] },
      { name: "Houndstooth", keywords: ["Houndstooth"] },
      { name: "Linen", keywords: ["Linen"] },
      { name: "Flannel", keywords: ["Flannel"] },
      { name: "Gabardine", keywords: ["Gabardine"] },
      { name: "Alpaca Blend", keywords: ["Alpaca Blend"] },
      { name: "Cotton", keywords: ["Cotton"] },
      { name: "Tartan", keywords: ["Tartan"] },
      { name: "Denim", keywords: ["Denim"] },
      { name: "Grasscloth", keywords: ["Grasscloth"] },
      { name: "Chino", keywords: ["Chino"] },

      // Fits
      { name: "Classic Fit", keywords: ["Classic Fit"] },
      { name: "Slim Fit", keywords: ["Slim Fit"] },
      { name: "Modern Fit", keywords: ["Modern Fit"] },
      { name: "Straight-Fit", keywords: ["Straight-Fit", "Straight Fit"] },
      { name: "Relaxed Fit", keywords: ["Relaxed Fit"] },
      { name: "10\" Performance", keywords: ["10\" Performance"] },
      { name: "8\" Shorts", keywords: ["8\" Shorts"] },
      { name: "7\" Swim Trunks", keywords: ["7\" Swim Trunks"] },
    ]
  },
  { // Style Type / Design
    level: "item_category3",
    options: [
      { name: "Plaid", keywords: ["Plaid"] },
      { name: "Floral", keywords: ["Floral", "Bloom", "Garden", "Leaf", "Fernwood"] },
      { name: "Geometric", keywords: ["Geometric", "Abstract", "Hexcomb", "Diamond"] },
      { name: "Stripe", keywords: ["Stripe"] },
      { name: "Tartan", keywords: ["Tartan"] },
      { name: "Gingham", keywords: ["Gingham"] },
      { name: "Houndstooth", keywords: ["Houndstooth"] },
      { name: "Metallic", keywords: ["Metallic"] },
      { name: "Sequin", keywords: ["Sequin"] },
      { name: "Performance", keywords: ["Performance"] },
      { name: "Fringe Design", keywords: ["Fringe"] },
      { name: "Printed", keywords: ["Printed"] },

      // Extract after " in " for specific style design
      { name: "Style Extract", keywords: [" in "], extractAfter: true }
    ]
  }
];
// Function to categorize product based on item name
function categorizeProduct(itemName) {
  const categorizedItem = {};

  categoryRules.forEach(rule => {
    // Find all matches in options for the given level
    const matches = rule.options
      .filter(option => {
        // Check for standard keyword match OR "extractAfter" logic
        if (option.extractAfter && option.keywords.some(keyword => itemName.includes(keyword))) {
          return true; // ExtractAfter condition matches
        }
        return option.keywords.some(keyword => itemName.includes(keyword)); // Standard match
      })
      .map(option => {
        // Handle "extractAfter" logic by splitting the item name on the keyword
        if (option.extractAfter) {
          const keyword = option.keywords.find(keyword => itemName.includes(keyword));
          if (keyword) {
            const extractedValue = itemName.split(keyword)[1].trim();
            return extractedValue; // Extract the portion after " in "
          }
        }
        return option.name; // Standard match name
      });

    // For item_category3, concatenate multiple matches
    if (rule.level === "item_category3") {
      categorizedItem[rule.level] = matches.length > 0 ? matches.join(", ") : "Other";
    } else {
      categorizedItem[rule.level] = matches.length > 0 ? matches[0] : "Other";
    }
  });

  return categorizedItem;
}





/** Impressions Array **/
// The impressions array must be less than 4000 characters. We are splitting the events into 20 and 16 since the pagination is for 36 items. This number will need to be adjusted accoridingly
// The most logical way to limit this is by the number of products you send 

const getImpressions = (items, collection, itemListName = "Site Browse", startIndex = 0) => {
  if (!items) return [];
  //console.log('PLP Impressions Data Raw:', items); // Log the original items data passed to getImpressions. Data can not be pulled from Collection as there will be many additional items showing which might have been hidden
  //console.log('CollectionData Raw:', collection);
  //console.log('Items Loaded (after slice):', items.slice(0, 20)); // Log the data after slicing
  // Transform collection.title to use pipes instead of slashes for collection_type
  const itemCollection = collection?.title ? collection.title.replace(/\//g, '|') : null;

  const category = collection?.displayTitle?.value || 'Uncategorized';
  const globalCurrencyCode = getGlobalCurrencyCode();
  return items.map((item, index) => {
    try {
      const variant = item.variations?.[0]?.data || {}; // Using the first variation data if available
      const price = parseFloat(item.data?.price?.toString() || undefined);
      const compareAtPrice = parseFloat(item.data?.variant_compare_at_prices?.[0]) || undefined;
      const discount = compareAtPrice > price ? compareAtPrice - price : 0;
      const categories = categorizeProduct(item.value || "");
      return {
        // item_id: item.data?.SKU?.toString() || item.data?.id?.toString(),             // Parent SKU
        item_id: item.data?.id?.toString(), //item ID
        item_name: item.value || undefined,                          // Product Name
        affiliation: "Shopify Store",
        //currency: globalCurrencyCode,
        currency: 'USD',
        coupon: undefined,
        discount: discount,
        item_brand: 'J. McLaughlin',
        item_collection: itemCollection, 
        item_category: categories.item_category || null,                                     // Collection Category
        item_category2: categories.item_category2 || null,                                   // General Category
        item_category3: categories.item_category3 || null,                                       // Additional Category if applicable
        item_category4: "OS",                                        // Assuming One size since info not available
        item_category5: item.data?.color || 'Color Not Available',   // Color from item data
        item_variant: item.data?.variant_ids?.[0] || undefined,       // Variant ID from variations
        item_carousel_title: undefined,
        item_list_id: "Product Listing",
        item_list_name: itemListName,
        location_id: "Product Listing",
        price: price,                  // Price
        compare_at_price: compareAtPrice,
        quantity: 1,
        index: startIndex + index,
        //item_sku: item.data?.SKU?.toString() || undefined,               // SKU from variations originally
        item_sku: undefined,
        item_variant_id: item.data?.SKU?.toString() || undefined,
        item_shopify_id: `shopify_US_${item.data?.id}_${item.data?.variant_ids?.[0]}`, // Full SKU with variant
        item_stock_message: variant.availableForSale ? "In Stock" : "Out of Stock",
        item_stock_quantity: variant.quantityAvailable || 0,         // Stock Quantity if available
        item_style_number: item?.data?.style_number || undefined,
      };
    } catch (error) {
      console.warn("Error processing item in impressions:", error, item);
      return {
        item_id: "No SKU",
        item_name: "No Name",
        item_brand: "J. McLaughlin",
        item_category: category,
        item_category2: "Woman",
        item_category3: undefined,
        item_category4: undefined,
        item_category5: undefined,
        item_variant: undefined,
        item_list_id: "Product Listing",
        item_list_name: itemListName,
        location_id: "Product Listing",
        price: 0,
        compare_at_price: 0,
        quantity: 1,
        index: startIndex + index,
        item_sku: undefined,
        item_shopify_id: "shopify_US_No SKU_No Variant ID",
        item_stock_message: undefined,
        item_stock_quantity: 0,
        item_style_number: undefined
      };
    }
  }).filter(Boolean);
};


/** Search page product impressions  **/
let searchContext = null; // Global variable to store search context to pick up on dl_select_item on search pages
export const pushViewSearchResultsNew = (
  items,
  customer,
  currencyCode = 'USD',
  query,
  totalResults,
) => {
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  console.log("DEBUG: pushViewSearchResultsNew called with:", {
    items,
    customer,
    query,
    totalResults,
    currencyCode,
  });

  const isSearchValid = totalResults > 0 ? "Valid Results" : undefined;
  const globalCurrencyCode = getGlobalCurrencyCode();
  // Store the search context for retrieval in dl_select_item
  searchContext = {
    searchTerm: query,
    totalResults: totalResults,
  };
  //console.log("DEBUG: Search context set:", searchContext);
  //console.log("DEBUG: Search validation status:", isSearchValid);
  const sendImpressionsEvent = (impressionItems, eventDetails, startIndex) => {
    //console.log("DEBUG: sendImpressionsEvent called with:", {
    //  impressionItems,
    //  eventDetails,
    //  startIndex,
    //});
    window.ElevarDataLayer.push({ ecommerce: null });
    window.ElevarDataLayer.push({
      event: 'dl_view_search_results',
      ecommerce: {
        event_details: eventDetails,
        user_details: {
          log_state: getUserProperties(customer)?.visitor_type,
          user_id: getUserProperties(customer)?.customer_id,
          total_spent: getUserProperties(customer)?.customer_total_spent,
          order_count: getUserProperties(customer)?.customer_order_count,
          customer_id: getUserProperties(customer)?.customer_id,
          enhanced_conversion: {
            email: getUserProperties(customer)?.customer_email,
            phone_number: getUserProperties(customer)?.customer_phone,
            first_name: getUserProperties(customer)?.customer_first_name,
            last_name: getUserProperties(customer)?.customer_last_name,
            street: getUserProperties(customer)?.customer_address_1,
            city: getUserProperties(customer)?.customer_city,
            state: getUserProperties(customer)?.customer_province,
            zip_code: getUserProperties(customer)?.customer_zip,
            country: getUserProperties(customer)?.customer_country,
          },
        },
        items: getImpressions(impressionItems, undefined, "Search Results", startIndex),
      },
    });
    //console.log("DEBUG: ElevarDataLayer after push:", window.ElevarDataLayer);
  };

  const eventDetails = {
    event_id: generateRandomId(),
    content_group: "Search Product Listing",
    search_term: query,
    count_of_results: totalResults,
    search_results: isSearchValid,
    currency: 'USD',
  };
  if (items.length === 0) {
    console.warn("DEBUG: No items to process. Firing dl_view_search_results for 0 results.");
    sendImpressionsEvent([], eventDetails, 0); // Fire event for 0 results
    return; // Exit early for no results case
  }

  // Chunk items into groups of 20 and send each chunk as a separate event
  const chunkSize = 20;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    setTimeout(() => {
      sendImpressionsEvent(chunk, eventDetails, i);
    }, i === 0 ? 2000 : 2500 + (i / chunkSize) * 500); // Adjust delay for subsequent chunks
  }
};
/* replaced with 20 + 16 Event trip as suggest in Elevar QA
  setTimeout(() => {
    window.ElevarDataLayer.push({ ecommerce: null });
    window.ElevarDataLayer.push({
      event: 'dl_search',
      //user_properties: getUserProperties(customer),
      ecommerce: {
        event_details: {
          event_id: eventId,
          content_group: "Search Product Listing",
          search_term: query,
          count_of_results: totalResults,
          search_results: isSearchValid
        },
        user_details: {
          log_state: getUserProperties(customer)?.visitor_type,
          //user_id: getUserProperties(customer)?.customer_id,
          total_spent: getUserProperties(customer)?.customer_total_spent,
          order_count: getUserProperties(customer)?.customer_order_count,
          customer_id: getUserProperties(customer)?.customer_id,
          enhanced_conversion: {
            email: getUserProperties(customer)?.customer_email,
            phone_number: getUserProperties(customer)?.customer_phone,
            first_name: getUserProperties(customer)?.customer_first_name,
            last_name: getUserProperties(customer)?.customer_last_name,
            street: getUserProperties(customer)?.customer_address_1,
            city: getUserProperties(customer)?.customer_city,
            state: getUserProperties(customer)?.customer_province,
            zip_code: getUserProperties(customer)?.customer_zip,
            country: getUserProperties(customer)?.customer_country
          }
        },
        //impressions: getImpressions(items),
      },
    });
    window.ElevarDataLayer.push({
      event: 'dl_view_search_results',
      //user_properties: getUserProperties(customer),
      ecommerce: {
        event_details: {
          event_id: eventId,
          content_group: "Search Product Listing",
          //currency: globalCurrencyCode,
          currency: 'USD',
          search_term: query,
          count_of_results: totalResults,
          search_results: isSearchValid
        },
        user_details: {
          log_state: getUserProperties(customer)?.visitor_type,
          user_id: getUserProperties(customer)?.customer_id,
          total_spent: getUserProperties(customer)?.customer_total_spent,
          order_count: getUserProperties(customer)?.customer_order_count,
          customer_id: getUserProperties(customer)?.customer_id,
          enhanced_conversion: {
            email: getUserProperties(customer)?.customer_email,
            phone_number: getUserProperties(customer)?.customer_phone,
            first_name: getUserProperties(customer)?.customer_first_name,
            last_name: getUserProperties(customer)?.customer_last_name,
            street: getUserProperties(customer)?.customer_address_1,
            city: getUserProperties(customer)?.customer_city,
            state: getUserProperties(customer)?.customer_province,
            zip_code: getUserProperties(customer)?.customer_zip,
            country: getUserProperties(customer)?.customer_country
          }
        },
        items: getImpressions(items, undefined, "Search Results"),
      },
    });
  }, 2000);/*
};
/** Collection page product impressions **/
export const pushViewItemListDataNew = async (items, customer, currency = 'USD', collection) => {
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  //const eventId = generateRandomId(); Moved it inside to generate unique ID in each chunk
  const category = collection.displayTitle?.value || 'General';
  //console.log("Collection", collection);
  // Transform collection.title to use pipes instead of slashes
  const collectionType = collection.title?.replace(/\//g, '|') || 'Collection';
  const sendImpressionsEvent = async (impressionItems, startIndex) => {
    const eventId = generateRandomId();
    window.ElevarDataLayer.push({ ecommerce: null });

    const impressions = await getImpressions(impressionItems, collection, "Product Listing", startIndex)

    window.ElevarDataLayer.push({
      event: 'dl_view_item_list',
      ecommerce: {
        event_details: {
          event_id: eventId,
          content_group: "Product Listing",
          collection_type: collectionType,
          search_term: undefined,
          currency: 'USD',
          count_of_search_results: undefined,
        },
        user_details: {
          log_state: getUserProperties(customer)?.visitor_type,
          total_spent: getUserProperties(customer)?.customer_total_spent,
          order_count: getUserProperties(customer)?.customer_order_count,
          customer_id: getUserProperties(customer)?.customer_id,
          enhanced_conversion: {
            email: getUserProperties(customer)?.customer_email,
            phone_number: getUserProperties(customer)?.customer_phone,
            first_name: getUserProperties(customer)?.customer_first_name,
            last_name: getUserProperties(customer)?.customer_last_name,
            street: getUserProperties(customer)?.customer_address_1,
            city: getUserProperties(customer)?.customer_city,
            state: getUserProperties(customer)?.customer_province,
            zip_code: getUserProperties(customer)?.customer_zip,
            country: getUserProperties(customer)?.customer_country,
          },
        },
        items: impressions,
      },
    });
  };

  // Chunk items into groups of 20 and send each chunk as a separate event
  const chunkSize = 20;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await sendImpressionsEvent(chunk, i);
  }
};

/** Collection page product impressions **/
/*Changed to the spit method as per Elevar QA

export const pushViewItemListDataNew = (items, customer, currency = 'USD', collection) => {
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  //console.log('Product Data Raw:', items);
  //console.log("Customer data in view_item_list:", customer);
  const category = collection.displayTitle?.value || 'General';

  window.ElevarDataLayer.push({ ecommerce: null });
  window.ElevarDataLayer.push({

    event: 'dl_view_item_list',

    //user_properties: getUserProperties(customer),
    ecommerce: {
      event_details: {
        event_id: eventId,
        content_group: "Product Listing",
        search_term: undefined,
        //currency,
        currency: 'USD',
        count_of_search_results: undefined
      },
      user_details: {
        log_state: getUserProperties(customer)?.visitor_type,
        //user_id: getUserProperties(customer)?.customer_id,
        total_spent: getUserProperties(customer)?.customer_total_spent,
        order_count: getUserProperties(customer)?.customer_order_count,
        customer_id: getUserProperties(customer)?.customer_id,
        enhanced_conversion: {
          email: getUserProperties(customer)?.customer_email,
          phone_number: getUserProperties(customer)?.customer_phone,
          first_name: getUserProperties(customer)?.customer_first_name,
          last_name: getUserProperties(customer)?.customer_last_name,
          street: getUserProperties(customer)?.customer_address_1,
          city: getUserProperties(customer)?.customer_city,
          state: getUserProperties(customer)?.customer_province,
          zip_code: getUserProperties(customer)?.customer_zip,
          country: getUserProperties(customer)?.customer_country
        }
      },
      items: getImpressions(items, collection, undefined, "Product Listing"),
    },
  });
};
*/



export const pushSelectItemAutocomplete = (
  product: any,
  customer: any,
  currencyCode: string,
  query: string,
  index: number
) => {
  //console.log("Autocomplete Items Input:", { product, query, index });

  try {


    if (!product) {
      console.warn("No product data available for autocomplete select item event.");
      return;
    }


    //console.log("Selected Product:", product);

    const item = {
      item_id: product?.data?.id || "Unknown ID",
      item_name: product?.value || "Unknown Name",
      item_brand: "J. McLaughlin",
      item_category: "", // Adjust as needed
      price: parseFloat(product?.data?.price) || 0,
      currency: "USD",
      position: index, // 1-based index for analytics
    };
    const eventId = generateRandomId();

    // Additional debug log for the constructed item
    //console.log("Constructed Item Object:", item);

    const globalCurrencyCode = getGlobalCurrencyCode();
    window.ElevarDataLayer = window.ElevarDataLayer ?? [];
    window.ElevarDataLayer.push({ ecommerce: null });
    window.ElevarDataLayer.push({
      event: "dl_select_item_autocomplete",
      ecommerce: {
        event_details: {
          event_id: eventId,
          content_group: "Autocomplete Results",
          search_term: query,
          currency: "USD",
        },
        user_details: {
          log_state: getUserProperties(customer)?.visitor_type,
          total_spent: getUserProperties(customer)?.customer_total_spent,
          order_count: getUserProperties(customer)?.customer_order_count,
          customer_id: getUserProperties(customer)?.customer_id,
          enhanced_conversion_data: {
            email: getUserProperties(customer)?.customer_email,
            phone_number: getUserProperties(customer)?.customer_phone,
            first_name: getUserProperties(customer)?.customer_first_name,
            last_name: getUserProperties(customer)?.customer_last_name,
            street: getUserProperties(customer)?.customer_address_1,
            city: getUserProperties(customer)?.customer_city,
            state: getUserProperties(customer)?.customer_province,
            zip_code: getUserProperties(customer)?.customer_zip,
            country: getUserProperties(customer)?.customer_country,
          },
        },
        items: [item],
      },
    });

    console.log("Autocomplete Select Item Event Pushed Successfully", {
      event: "dl_select_item_autocomplete",
      item,
    });
  } catch (error) {
    console.error("Error in pushSelectItemAutocomplete:", error);
    //window.dataLayer.push({
    //event: "gtm.pageError",
    //errorMessage: error.message,
    //});
  }
};

const getProductData = (product, index?: number, itemListName = "Site Browse") => {
  //console.log ("Product Data", product);
  const globalCurrencyCode = getGlobalCurrencyCode();
  const sizeOption = product.selectedVariant?.selectedOptions?.find(option => option.name === "Size");
  const colorOption = product.selectedVariant?.selectedOptions?.find(option => option.name === "Color");
  // Extract category1 from the sizeChart
  const category1 = product.sizeChart?.reference?.fields?.[0]?.value || undefined; // Safeguard for category1
  // Extract just the numeric product ID from the product.id string
  const shopifyProductId = product.id?.split("/").pop() || 'Unknown Shopify ID';
  // Extract just the numeric variant ID from the product.selectedVariant.id string
  const shopifyVariantId = product.selectedVariant?.id?.split("/").pop() || 'Unknown Variant ID';
  // Construct item_parent_variant_id
  const itemParentVariantId = `shopify_US_${shopifyProductId}_${shopifyVariantId}`;
  // Determine category2 based on sizeChart description
  const category2 = product.sizeChart?.reference?.fields?.some(field => field.value.toLowerCase().includes('women'))
    ? 'Women'
    : product.sizeChart?.reference?.fields?.some(field => field.value.toLowerCase().includes('men'))
      ? 'Men'
      : undefined; // Safeguard for category2
  const price = product?.selectedVariant?.compareAtPrice?.amount
    ? parseFloat(product?.selectedVariant?.compareAtPrice?.amount)
    : product?.selectedVariant?.price?.amount
      ? parseFloat(product?.selectedVariant?.price?.amount)
      : 0; // Set to 0 or another fallback value if both are missing  
  const compareAtPrice = parseFloat(
    product?.selectedVariant?.compareAtPrice?.amount || 0
  );
  const discount = compareAtPrice > 0 ? compareAtPrice - price : 0;
  const categories = categorizeProduct(product.title || "");

  return [
    {
      //item_id: product?.selectedVariant?.sku || '', //Originally
      item_id: shopifyProductId,
      item_name: product.title,
      item_brand: product.vendor ?? 'J. McLaughlin',
      affiliation: 'Shopify Store',
      currency: globalCurrencyCode,
      coupon: undefined,
      compare_at_price: parseFloat(product?.selectedVariant?.compareAtPrice?.amount || 0),
      discount: discount,
      index: typeof index === 'number' ? index : null,
      item_category: categories.item_category || null,
      item_category2: categories.item_category2 || null,
      item_category3: categories.item_category3 || null,
      item_category4: sizeOption?.value || undefined, // Product Size | Option 1 (productGlobalObject)
      item_category5: colorOption?.value || undefined, // Product Color | Option 2 (productGlobalObject)
      item_variant: shopifyVariantId, // Product Variant ID
      //item_sku: product.selectedVariant.sku, // Product Sku originally
      item_sku: product.parentSku?.value || undefined,
      item_variant_id: product.selectedVariant.sku,
      item_shopify_id: itemParentVariantId,
      item_carousel_title: undefined,
      item_list_id: "Product Listing",
      item_list_name: itemListName,
      location_id: "Product Listing",
      price: parseFloat(product?.selectedVariant?.price?.amount || 0),
      quantity: 1,
      item_stock_message: product?.selectedVariant?.availableForSale ? "In Stock" : "Out of Stock",
      item_stock_quantity: product?.selectedVariant?.quantityAvailable || 0          // Stock Quantity if available

    },
  ];
};


const determineAddToCartContext = () => {
  if (typeof window === 'undefined') return 'Product Detail';
  return window.document.body.classList.contains('quick-view-open')
    ? 'Quick View'
    : 'Product Detail';
};

export const pushSelectItemNew = (
  product,
  customer,
  currencyCode = 'USD',
  index
) => {
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  //console.log("Product Select Data", product);

  // Determine the context dynamically based on URL or other clues
  const currentPath = window.location.pathname;

  // Read context from localStorage
  const addToCartContext = localStorage.getItem('addToCartContext') || null;
  //console.log('Using Context for Add to Cart:', addToCartContext);

  // Clear context from localStorage after retrieving it
  if (addToCartContext) {

    localStorage.removeItem('addToCartContext');

    //console.log('Cleared addToCartContext from localStorage');

  }

  let context;
  if (currentPath.includes('/search')) {
    context = "Search Results";
  } else if (currentPath.includes('/collections')) {
    context = "Site Browse";
  } else {
    context = "Other"; // Default fallback if neither match
  }
  // Set content group and item list name based on the determined context
  const contentGroup = addToCartContext === "Quick View"
    ? "Quick View"
    : context === "Search Results"
      ? "Search Product Listing"
      : "Product Listing";
  const itemListName = context === "Search Results" ? "Search Results" : "Site Browse";
  // Use search context if available and the current context is "Search Results"
  const searchTerm = context === "Search Results" ? searchContext?.searchTerm : undefined;
  const countOfResults = context === "Search Results" ? searchContext?.totalResults : undefined;

  // Log the context for debugging
  //console.log("Determined Context:", context);
  //console.log("Content Group for Event:", contentGroup);
  //console.log("Item List Name for Event:", itemListName);
  //console.log("Current Path:", currentPath);
  const eventId = generateRandomId();
  const globalCurrencyCode = getGlobalCurrencyCode();
  window.ElevarDataLayer.push({ ecommerce: null });
  window.ElevarDataLayer.push({
    event: 'dl_select_item',
    ecommerce: {
      event_details: {
        event_id: eventId,
        content_group: contentGroup,
        search_term: searchTerm,
        currency: globalCurrencyCode,
        count_of_search_results: countOfResults,
      },
      user_details: {
        log_state: getUserProperties(customer)?.visitor_type,
        //user_id: getUserProperties(customer)?.customer_id,
        total_spent: getUserProperties(customer)?.customer_total_spent,
        order_count: getUserProperties(customer)?.customer_order_count,
        customer_id: getUserProperties(customer)?.customer_id,
        enhanced_conversion_data: {
          email: getUserProperties(customer)?.customer_email,
          phone_number: getUserProperties(customer)?.customer_phone,
          first_name: getUserProperties(customer)?.customer_first_name,
          last_name: getUserProperties(customer)?.customer_last_name,
          street: getUserProperties(customer)?.customer_address_1,
          city: getUserProperties(customer)?.customer_city,
          state: getUserProperties(customer)?.customer_province,
          zip_code: getUserProperties(customer)?.customer_zip,
          country: getUserProperties(customer)?.customer_country
        }
      },
      items: getProductData(product, index, itemListName).map((item) => ({
        ...item,
        location_id: addToCartContext || context, // Use addToCartContext(QV) if available, otherwise default context
      })),

    }
  });

  console.log("Select Item Event Pushed:", {
    event: 'dl_select_item',
    contentGroup,
    itemListName,
    context,
    addToCartContext,


  });

};



// Track the last viewed variant route globally
let lastViewedVariantRoute = '';
let lastViewItemTimestamp = 0;
export const pushViewItemNew = (product, customer, currencyCode = 'USD') => {
  if (suppressViewItemEvent) {
    //console.log('dl_view_item suppressed due to recent dl_add_to_cart.');
    return;
  }
  window.ElevarDataLayer = window.ElevarDataLayer || [];
  //console.log('PDP:', product);
  // Check if product and selectedVariant exist
  if (!product || !product.selectedVariant || !product.selectedVariant.price) {
    console.warn('Product or selected variant data is missing. Skipping view_item event.');
    return; // Exit the function early if data is incomplete
  }
  // Get the full current route
  const currentVariantRoute = window.location.pathname + window.location.search;

  // Get the current timestamp
  const currentTimestamp = Date.now();

  // Allow firing if:
  // - The route has changed, OR
  // - It’s been more than 3 seconds since the last dl_view_item event
  if (
    currentVariantRoute === lastViewedVariantRoute &&
    currentTimestamp - lastViewItemTimestamp < 3000
  ) {
    console.log('dl_view_item event skipped: Same variant viewed recently:', currentVariantRoute);
    return; // Skip firing
  }
  // Update the last tracked route
  lastViewedVariantRoute = currentVariantRoute;

  // console.log('Initiating view_item event...');
  //console.log('Product data:', product);
  // console.log('Customer data:', customer);
  // console.log('Currency Code:', currencyCode);
  // Safeguards for size and color
  const sizeOption = product.selectedVariant?.selectedOptions?.find(option => option.name === "Size");
  const colorOption = product.selectedVariant?.selectedOptions?.find(option => option.name === "Color");
  // Extract category1 from the sizeChart
  const category1 = product.sizeChart?.reference?.fields?.[0]?.value || undefined; // Safeguard for category1
  // Extract just the numeric product ID from the product.id string
  const shopifyProductId = product.id?.split("/").pop() || 'Unknown Shopify ID';
  // Extract just the numeric variant ID from the product.selectedVariant.id string
  const shopifyVariantId = product.selectedVariant?.id?.split("/").pop() || 'Unknown Variant ID';
  // Construct item_parent_variant_id
  const itemParentVariantId = `shopify_US_${shopifyProductId}_${shopifyVariantId}`;

  // Determine category2 based on sizeChart description
  const category2 = product.sizeChart?.reference?.fields?.some(field => field.value.toLowerCase().includes('women'))
    ? 'Women'
    : product.sizeChart?.reference?.fields?.some(field => field.value.toLowerCase().includes('men'))
      ? 'Men'
      : undefined; // Safeguard for category2
  /*
  const price = product?.selectedVariant?.compareAtPrice?.amount
    ? parseFloat(product?.selectedVariant?.compareAtPrice.amount)
    : product?.selectedVariant?.price?.amount
      ? parseFloat(product?.selectedVariant?.price?.amount)
      : 0; // Set to 0 or another fallback value if both are missing  
  const compareAtPrice = product?.selectedVariant?.compareAtPrice?.amount
    ? parseFloat(product.selectedVariant.compareAtPrice.amount)
    : undefined;
  */
  const currentPrice = product?.selectedVariant?.price?.amount
    ? parseFloat(product.selectedVariant.price.amount)
    : 0;

  const compareAtPrice = product?.selectedVariant?.compareAtPrice?.amount
    ? parseFloat(product.selectedVariant.compareAtPrice.amount)
    : undefined;

  const discount = compareAtPrice ? compareAtPrice - currentPrice : 0;

  const categories = categorizeProduct(product.title || "");

  const eventId = generateRandomId();
  const globalCurrencyCode = getGlobalCurrencyCode();


  const couponCode = getDiscountCodes();

  const itemData = {
    //item_id: product.parentSku?.value || 'No Parent SKU', // Parent Sku Originally
    item_id: shopifyProductId || undefined, //Changed to Product ID
    item_name: product.title || undefined, // Product Name (w/o variant info)
    affiliation: 'Shopify Store',
    currency: globalCurrencyCode,
    coupon: couponCode,
    compare_at_price: compareAtPrice,
    discount: discount,
    index: 0,
    item_brand: product.vendor || 'J. McLaughlin', // Product Brand
    item_category: categories.item_category || null,
    item_category2: categories.item_category2 || null,
    item_category3: categories.item_category3 || null,
    item_category4: sizeOption?.value || undefined, // Product Size | Option 1 (productGlobalObject)
    item_category5: colorOption?.value || undefined, // Product Color | Option 2 (productGlobalObject)
    item_variant: shopifyVariantId, // Product Variant ID
    item_carousel_title: undefined,
    item_list_id: 'Product Listing',
    item_list_name: 'Site Browse',
    location_id: 'Product Detail',
    //price: product?.selectedVariant?.compareAtPrice?.amount
    //  ? parseFloat(product.selectedVariant.compareAtPrice.amount)
    //  : parseFloat(product.selectedVariant.price?.amount),
    price: currentPrice,
    quantity: 1,
    //item_sku: product.selectedVariant?.sku || "No Product SKU", // Product Sku originally
    item_variant_sku: product.parentSku?.value || undefined,
    item_variant_id: product.selectedVariant?.sku || undefined,
    //item_style_num: product.parentSku.value,                                        // Item Style
    //item_shopify_id: shopifyProductId,                                                     //shopify Product GID
    item_shopify_id: itemParentVariantId,
    item_stock_message:
      product.selectedVariant?.quantityAvailable != null
        ? product.selectedVariant.quantityAvailable > 0
          ? 'In Stock'
          : 'Out of Stock'
        : undefined,
    item_stock_quantity: product.selectedVariant.quantityAvailable,
    item_style_number: product.styleNumber?.value || undefined,

  };

  //console.log('Item data to push:', itemData);
  setTimeout(() => {
    window.ElevarDataLayer.push({ ecommerce: null });
    window.ElevarDataLayer.push({
      event: 'dl_view_item',
      ecommerce: {
        event_details: {
          event_id: eventId,
          content_group: 'Product Detail',
          currency: globalCurrencyCode,
          value: product?.selectedVariant ? parseFloat(product.selectedVariant.price?.amount) : undefined,
          coupon: couponCode,
        },
        items: [itemData],
        user_details: {
          log_state: getUserProperties(customer)?.visitor_type,
          //user_id: getUserProperties(customer)?.customer_id,
          total_spent: getUserProperties(customer)?.customer_total_spent,
          order_count: getUserProperties(customer)?.customer_order_count,
          customer_id: getUserProperties(customer)?.customer_id,
          enhanced_conversion: {                // GOOGLE ADS ENHANCED CONVERSION
            email: getUserProperties(customer)?.customer_email,       // Return the users email address
            phone_number: getUserProperties(customer)?.customer_phone,              // Return the users phone number
            first_name: getUserProperties(customer)?.customer_first_name,                    // Return the users first name
            last_name: getUserProperties(customer)?.customer_last_name,                     // Return the users last name
            street: getUserProperties(customer)?.customer_address_1,        // Return the users street address
            city: getUserProperties(customer)?.customer_city,                   // Return the users City
            state: getUserProperties(customer)?.customer_province,                             // Return the users state
            zip_code: getUserProperties(customer)?.customer_zip,                       // Return the users postal zip code
            country: getUserProperties(customer)?.customer_country                           // Return the users country
          },
        }
      },
      //user_properties: getUserProperties(customer),

    });
  }, 1000);
  //console.log('view_item event pushed to dataLayer successfully.', dataLayer);
};



const getCartActionProduct = (lineItem, quantityOverride) => {
  const quantity = quantityOverride || lineItem.quantity;
  const variant = lineItem.merchandise || {};
  const product = variant.product || {};
  const globalCurrencyCode = getGlobalCurrencyCode();
  const couponCode = getDiscountCodes();
  //const productGid: stripGlobalId(variant.productGid);
  // Attempt to get color and size from selectedOptions first
  let colorOption = variant.selectedOptions?.find(option => option.name === 'Color')?.value || null;
  let sizeOption = variant.selectedOptions?.find(option => option.name === 'Size')?.value || null;

  // If color or size is not found in selectedOptions, try extracting from variant.title
  if (!colorOption || !sizeOption) {
    const titleParts = (variant.title || '').split('/').map(val => val.trim());
    sizeOption = sizeOption || titleParts.pop() || 'Size Not Available';
    colorOption = colorOption || titleParts.join('/') || 'Color Not Available';
  }
  // Safely strip down GID values for product and variant IDs
  const stripGlobalId = (globalId) => globalId?.split("/").pop() || 'Unknown ID';
  // Safeguard price and compareAtPrice values
  const price = parseFloat(variant.price?.amount);
  const compareAtPrice = parseFloat(variant.compareAtPrice?.amount) || undefined;
  const discount = compareAtPrice > 0 ? compareAtPrice - price : 0;
  const categories = categorizeProduct(product.title || "");
  const cartProductData = [
    {
      item_id: stripGlobalId(lineItem.productGid),
      item_name: product.title || undefined,
      affiliation: "Shopify Store",
      currency: globalCurrencyCode,
      coupon: couponCode,
      discount: discount,
      index: 0,
      item_brand: lineItem.brand || 'J. McLaughlin',
      item_category: categories.item_category || null,
      item_category2: categories.item_category2 || null,
      item_category3: categories.item_category3 || null,
      item_category4: sizeOption,
      item_category5: colorOption,
      item_variant: stripGlobalId(lineItem.variantGid),
      item_variant_sku: undefined,
      item_variant_id: stripGlobalId(variant.product.id),
      item_carousel_title: undefined,
      item_list_id: "Product Listing",
      item_list_name: "Site Browse",
      location_id: "Product Detail",
      price: price,
      quantity: quantity.toString(),
      item_stock_message: undefined,
      item_stock_quantity: undefined,
      //product_id: stripGlobalId(variant.product.id),
      //variant_id: stripGlobalId(variant.id),
      compare_at_price: compareAtPrice,

    },
  ];

  return [cartProductData];
};


let suppressViewItemEvent = false; // Global flag

export const pushAddToCartNew = (
  lineItem,
  quantity,
  customer,
  currencyCode = 'USD',
) => {
  // console.log("Lineitem", lineItem, "qty", quantity);
  // const [cartProductData] = getCartActionProduct(lineItem, quantity);

  // Read context from localStorage
  const addToCartContext = localStorage.getItem('addToCartContext') || 'Product Detail';
  //console.log('Using Context for Add to Cart:', addToCartContext);

  // Set quickViewEventGuard based on the context. This is being used in pushQuickViewItemEvent to block it from firing again right after add to cart button is clicked 
  if (addToCartContext === 'Quick View') {
    //console.log('Add to Cart triggered from Quick View. Setting quickViewEventGuard.');
    setGuardWithTimeout('quickViewEventGuard', 5000); // Extended timing to avoid overlaps


  }


  // Determine content_group and location_id based on context
  const contentGroup = addToCartContext;
  const locationId = addToCartContext;




  // Ensure quantity is a valid integer
  const validQuantity = parseInt(quantity, 10) || 1;
  const [cartProductData] = getCartActionProduct(lineItem, validQuantity);

  if (!cartProductData || cartProductData.length === 0) {
    console.warn('No product data available for add_to_cart event');
    return;
  }
  // Set the context dynamically in the cartProductData
  cartProductData.forEach((item) => {
    item.location_id = locationId;
  });
  // Delay execution slightly to allow flags to be updated
  setTimeout(() => {

    //console.log("cartProductData", cartProductData);
    const couponCode = getDiscountCodes();

    if (!cartProductData || cartProductData.length === 0) {
      console.warn('No product data available for add_to_cart event');
      return;
    }
    const globalCurrencyCode = getGlobalCurrencyCode();
    // Calculate total value (price * quantity)
    const totalValue = parseFloat(cartProductData[0].price) * parseInt(quantity, 10);

    // Safeguard for invalid totalValue
    const finalValue = isNaN(totalValue) ? 0 : Math.round(totalValue * 100) / 100;
    const eventId = generateRandomId();

    window.ElevarDataLayer = window.ElevarDataLayer ?? [];
    window.ElevarDataLayer.push({ ecommerce: null });
    window.ElevarDataLayer.push({
      event: 'dl_add_to_cart',
      ecommerce: {
        event_details: {
          event_id: eventId,
          content_group: contentGroup,
          currency: globalCurrencyCode,
          value: finalValue,
          coupon: couponCode,
          sku_count: cartProductData.length, //Count of unique skus adding to cart
          cart_qty: validQuantity, // Sum of quantity in cart
        },
        user_details: {
          log_state: getUserProperties(customer)?.visitor_type,
          //user_id: getUserProperties(customer)?.customer_id,
          total_spent: getUserProperties(customer)?.customer_total_spent,
          order_count: getUserProperties(customer)?.customer_order_count,
          customer_id: getUserProperties(customer)?.customer_id,
          enhanced_conversion: {                // GOOGLE ADS ENHANCED CONVERSION
            email: getUserProperties(customer)?.customer_email,       // Return the users email address
            phone_number: getUserProperties(customer)?.customer_phone,              // Return the users phone number
            first_name: getUserProperties(customer)?.customer_first_name,                    // Return the users first name
            last_name: getUserProperties(customer)?.customer_last_name,                     // Return the users last name
            street: getUserProperties(customer)?.customer_address_1,        // Return the users street address
            city: getUserProperties(customer)?.customer_city,                   // Return the users City
            state: getUserProperties(customer)?.customer_province,                             // Return the users state
            zip_code: getUserProperties(customer)?.customer_zip,                       // Return the users postal zip code
            country: getUserProperties(customer)?.customer_country                           // Return the users country
          },
        },
        items: cartProductData,
      },
    });
    //console.log('add_to_cart event pushed to dataLayer successfully.', cartProductData);
    //console.log('Add to Cart Event Pushed:', { content_group: contentGroup, location_id: locationId, });
  }, 1200);
  // Set flag to suppress dl_view_item & dl_quick_view_item
  suppressViewItemEvent = true;// DO NOT CHANGE. Tied to the calculation of timings
  setTimeout(() => {
    suppressViewItemEvent = false;
  }, 4000); // Adjust timing if more events are introduced in future
};



/** Remove from Cart // note the list object which carries from collection page **/
export const pushRemoveFromCartNew = (
  lineItem,
  customer,
  currencyCode = 'USD',
  context = 'decrease', // Context: 'decrease' for minus button, 'remove' for remove button
) => {
  const [cartProductData] = getCartActionProduct(lineItem);
  //console.log("CartLineItems: ", lineItem);
  const quantity = lineItem.quantity || 1; // Original quantity in the cart
  const decreasedQuantity = context === 'remove' ? quantity : 1; // Remove full quantity for 'remove', or 1 for 'decrease'
  const updatedQuantity = context === 'remove' ? 0 : quantity - decreasedQuantity; // Remaining quantity in the cart
  const variant = lineItem.merchandise || {};
  const product = variant.product || {};
  // Calculate the total value of the removed quantity
  const price = parseFloat(variant.price?.amount || 0);
  const totalValue = price * decreasedQuantity;
  // Attempt to get color and size from selectedOptions first
  let colorOption = variant.selectedOptions?.find(option => option.name === 'Color')?.value || null;
  let sizeOption = variant.selectedOptions?.find(option => option.name === 'Size')?.value || null;
  // If color or size is not found in selectedOptions, try extracting from variant.title
  if (!colorOption || !sizeOption) {
    const titleParts = (variant.title || '').split('/').map(val => val.trim());
    sizeOption = sizeOption || titleParts.pop() || 'Size Not Available';
    colorOption = colorOption || titleParts.join('/') || 'Color Not Available';
  }
  const globalCurrencyCode = getGlobalCurrencyCode();
  const couponCode = getDiscountCodes();
  // Calculate the total value of the removed item(s)
  //const price = parseFloat(variant.price?.amount || 0);
  //const totalValue = price * quantity;
  const categories = categorizeProduct(product.title || "");
  //const discount = compareAtPrice > 0 ? compareAtPrice - price : 0; Do not have this field 
  const removedFromCartData = [
    {
      item_id: stripGlobalId(lineItem.merchandise.product.id),
      item_name: product.title || undefined,
      affiliation: 'Shopify Store',
      currency: globalCurrencyCode,
      coupon: couponCode,
      discount: undefined,
      index: 0,
      item_brand: 'J. McLaughlin',
      item_category: categories.item_category || null,
      item_category2: categories.item_category2 || null,
      item_category3: categories.item_category3 || null,
      item_category4: sizeOption,
      item_category5: colorOption,
      item_variant: stripGlobalId(lineItem.merchandise.id),
      item_variant_sku: undefined,
      item_variant_id: lineItem.merchandise.sku || undefined,
      item_carousel_title: undefined,
      item_list_id: "Product Listing",
      item_list_name: "Site Browse",
      location_id: "Cart",
      price: parseFloat(variant.price.amount),
      quantity: decreasedQuantity.toString(), // Quantity being removed
      item_stock_message: undefined,
      item_stock_quantity: undefined,
      // product_id: stripGlobalId(variant.product.id),
      //variant_id: stripGlobalId(variant.id),
      compare_at_price: undefined

    },
  ];
  const eventId = generateRandomId();


  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  window.ElevarDataLayer.push({
    event: 'dl_remove_from_cart',
    ecommerce: {
      event_details: {
        event_id: eventId,
        content_group: "Cart",
        currency: globalCurrencyCode,
        value: totalValue.toFixed(2),
        coupon: couponCode,
        //sku_count: cartProductData.length, //Count of unique skus adding to cart
        sku_count: 1, // Since only 1 SKU is being updated
        cart_qty: decreasedQuantity, // Always set to the quantity being reduced (1 for minus click)
      },
      user_details: {
        log_state: getUserProperties(customer)?.visitor_type,
        //user_id: getUserProperties(customer)?.customer_id,
        total_spent: getUserProperties(customer)?.customer_total_spent,
        order_count: getUserProperties(customer)?.customer_order_count,
        customer_id: getUserProperties(customer)?.customer_id,
        enhanced_conversion: {                // GOOGLE ADS ENHANCED CONVERSION
          email: getUserProperties(customer)?.customer_email,       // Return the users email address
          phone_number: getUserProperties(customer)?.customer_phone,              // Return the users phone number
          first_name: getUserProperties(customer)?.customer_first_name,                    // Return the users first name
          last_name: getUserProperties(customer)?.customer_last_name,                     // Return the users last name
          street: getUserProperties(customer)?.customer_address_1,        // Return the users street address
          city: getUserProperties(customer)?.customer_city,                   // Return the users City
          state: getUserProperties(customer)?.customer_province,                             // Return the users state
          zip_code: getUserProperties(customer)?.customer_zip,                       // Return the users postal zip code
          country: getUserProperties(customer)?.customer_country                           // Return the users country
        },
      },

      items: removedFromCartData
    },

  });
  //console.log('remove_from_cart event pushed to dataLayer successfully.', cartProductData);
  // Set flag to suppress dl_view_item & dl_quick_view_item
  suppressViewItemEvent = true;// DO NOT CHANGE. Tied to the calculation of timings
  setTimeout(() => {
    suppressViewItemEvent = false;
  }, 4000); // Adjust timing if more events are introduced in future
};

const getProductsFromCart = (cart) => {
  if (!cart || !cart.lines?.edges) return [];

  return cart.lines.edges.map((edge, index) => {
    const line = edge.node;
    const variant = line.merchandise;
    const colorOption = variant.selectedOptions?.find(option => option.name === 'Color')?.value || 'Color Not Available';
    const sizeOption = variant.selectedOptions?.find(option => option.name === 'Size')?.value || 'Size Not Available';
    const price = parseFloat(variant.price?.amount);
    const compareAtPrice = parseFloat(variant.compareAtPrice?.amount) || undefined;
    const discount = compareAtPrice > 0 ? compareAtPrice - price : 0;
    const couponCode = getDiscountCodes();
    const globalCurrencyCode = getGlobalCurrencyCode();
    const categories = categorizeProduct(variant.product.title || "");
    return {
      //item_id: variant.sku,// Originally
      item_id: stripGlobalId(variant.product.id),
      item_name: variant.product.title,
      affiliation: 'Shopify Store',
      currency: globalCurrencyCode,
      item_brand: 'J. McLaughlin',
      item_category: categories.item_category || null,
      item_category2: categories.item_category2 || null,
      item_category3: categories.item_category3 || null,
      item_category4: sizeOption,
      item_category5: colorOption,
      item_variant: stripGlobalId(variant.id),
      //variant: variant.title, //Deprecated
      item_carousel_title: undefined,
      item_list_id: "Product Listing",
      item_list_name: "Site Browse",
      item_sku: undefined,
      item_variant_id: variant.sku,
      location_id: "Cart",
      price: price,
      quantity: line.quantity.toString(),
      index: index + 1,
      //product_id: stripGlobalId(variant.product.id),
      //variant_id: stripGlobalId(variant.id),
      compare_at_price: compareAtPrice,
      discount: discount,
      coupon: couponCode,
    };
  });
};

const getCartTotal = (cart) => {
  return cart?.cost?.subtotalAmount?.amount || '0';
};

const getTotalQuantity = (cart) => {
  return cart?.totalQuantity || 0;
};

const getCouponCode = (cart) => {
  if (cart?.discountCodes?.length > 0) {
    // Find the first applicable discount code
    const applicableCode = cart.discountCodes.find(code => code.applicable);
    return applicableCode ? applicableCode.code : '';
  }
  return '';
};

const getTotalDiscount = (cart) => {
  if (!cart || !cart.lines || !cart.lines.edges) return 0;

  return cart.lines.edges.reduce((totalDiscount, edge) => {
    const line = edge.node;
    const quantity = line.quantity;

    // Calculate the total cost before the discount
    const totalCostBeforeDiscount = parseFloat(line.cost.amountPerQuantity.amount) * quantity;

    // Calculate the total cost after the discount
    const totalCostAfterDiscount = parseFloat(line.cost.totalAmount.amount) * quantity;

    // Calculate the discount for this line item and add to the total discount
    const lineDiscount = totalCostBeforeDiscount - totalCostAfterDiscount;
    return totalDiscount + lineDiscount;
  }, 0).toFixed(2); // Round to 2 decimal places for precision . Not to be used as it calculates all the items and cart discount 
};


/** Cart Drawer and Cart Page **/
export const pushViewCartNew = (cart, customer, currencyCode = 'USD') => {
  //console.log("Cart:", cart);
  if (isGuardActive('quickViewEventGuard') || isGuardActive('addToCartGuard')) {
    return; // Suppress if guards are active
  }
  const totalDiscount = getTotalDiscount(cart); // Calculate total discount
  const globalCurrencyCode = getGlobalCurrencyCode();
  const eventId = generateRandomId();
  setTimeout(() => {
    window.ElevarDataLayer = window.ElevarDataLayer ?? [];
    window.ElevarDataLayer.push({
      event: 'dl_view_cart',
      ecommerce: {
        event_details: {
          event_id: eventId,
          content_group: "Cart",
          currency: globalCurrencyCode,
          value: parseFloat(getCartTotal(cart)),
          discount: undefined, // To Be picked up during Checkout
          coupon: getCouponCode(cart) || undefined,
          sku_count: getProductsFromCart(cart).length, // Count of unique skus in the cart
          cart_qty: getTotalQuantity(cart), // Sum of quantity in cart
        },
        user_details: {
          log_state: getUserProperties(customer)?.visitor_type,
          //user_id: getUserProperties(customer)?.customer_id,
          total_spent: getUserProperties(customer)?.customer_total_spent,
          order_count: getUserProperties(customer)?.customer_order_count,
          customer_id: getUserProperties(customer)?.customer_id,
          enhanced_conversion: {
            email: getUserProperties(customer)?.customer_email,
            phone_number: getUserProperties(customer)?.customer_phone,
            first_name: getUserProperties(customer)?.customer_first_name,
            last_name: getUserProperties(customer)?.customer_last_name,
            street: getUserProperties(customer)?.customer_address_1,
            city: getUserProperties(customer)?.customer_city,
            state: getUserProperties(customer)?.customer_province,
            zip_code: getUserProperties(customer)?.customer_zip,
            country: getUserProperties(customer)?.customer_country,
          },

        },
        items: getProductsFromCart(cart),
      },
    });
  }, 2500); //DO NOT CHANGE. This is tied to the timings of pushviewquickevent timings. To block quick item event firing right after add to cart 
  // Set flag to suppress dl_view_item & dl_quick_view_item
  suppressViewItemEvent = true;// DO NOT CHANGE. Tied to the calculation of timings
  setTimeout(() => {
    suppressViewItemEvent = false;
  }, 4000); // Adjust timing if more events are introduced in future
};

export const pushQuickViewItemEvent = (product, variant, currencyCode = 'USD', customer, index) => {
  if (isGuardActive('quickViewEventGuard') || isGuardActive('addToCartGuard')) {
    return; // Prevent firing if guards are active
  }
  if (suppressViewItemEvent) {
    //console.log('dl_quick_view_item suppressed due to recent dl_add_to_cart.');
    return;
  }
  //console.log('Product Passed to pushQuickViewItemEvent:', product);
  try {
    //console.log('Triggering pushQuickViewItemEvent...');
    //console.log('Product:', product);
    //console.log('Variant:', variant);
    //console.log('Debug pushQuickViewItemEvent Input:', { product, variant, currencyCode, customer });

    /*    if (!product || !variant) {
          console.warn('Product or variant data is missing but proceeding with defaults.');
          //return;
        }
    */
    // Check the quickViewEventGuard set during dl_add_to_cart in localStorage
    if (localStorage.getItem('quickViewEventGuard') === 'true') {
      // console.log('Blocking dl_quick_view_item due to Quick View Add to Cart.');
      return; // Block the event
    }
    //console.log('Full Product Object at Start:', product);
    //console.log('Product Selected Variant:', product?.selectedVariant);
    const selectedVariant = product?.selectedVariant || variant;
    //console.log('Final Selected Variant:', selectedVariant);

    // Check if product and selectedVariant exist
    if (!product || !selectedVariant) {
      console.warn('Product or selected variant data is missing. but proceeding with defaults.');
      // return; // Exit the function early if data is incomplete
    }
    // Safeguards for size and color
    const sizeOption = selectedVariant?.selectedOptions?.find(option => option.name === "Size");
    const colorOption = selectedVariant?.selectedOptions?.find(option => option.name === "Color");
    // Extract category1 from the sizeChart
    const category1 = product.sizeChart?.reference?.fields?.[0]?.value || undefined; // Safeguard for category1
    // Extract just the numeric product ID from the product.id string
    const shopifyProductId = product.id?.split("/").pop() || undefined;
    // Extract just the numeric variant ID from the product.selectedVariant.id string
    const shopifyVariantId = selectedVariant?.id.split("/").pop() || undefined;
    // Construct item_parent_variant_id
    const itemParentVariantId = `shopify_US_${shopifyProductId}_${shopifyVariantId}`;

    // Determine category2 based on sizeChart description
    const category2 = product.sizeChart?.reference?.fields?.some(field => field.value.toLowerCase().includes('women'))
      ? 'Women'
      : product.sizeChart?.reference?.fields?.some(field => field.value.toLowerCase().includes('men'))
        ? 'Men'
        : undefined; // Safeguard for category2
    const price = parseFloat(selectedVariant?.price?.amount || 0);
    const compareAtPrice = selectedVariant?.compareAtPrice?.amount ? parseFloat(selectedVariant.compareAtPrice.amount) : undefined; // Use null if compareAtPrice is not available
    const discount = compareAtPrice ? compareAtPrice - price : 0;
    const globalCurrencyCode = getGlobalCurrencyCode();
    const eventId = generateRandomId();

    const couponCode = getDiscountCodes();

    const categories = categorizeProduct(product.title || "");
    // Construct item data for the event
    const itemData = {
      //item_id: product.parentSku?.value || 'No Parent SKU', // Parent Sku Originally
      item_id: shopifyProductId || undefined, //Changed to Product ID
      item_name: product.title || undefined, // Product Name (w/o variant info)
      affiliation: 'Shopify Store',
      currency: globalCurrencyCode,
      coupon: couponCode,
      compare_at_price: compareAtPrice,
      discount: discount,
      index: index || 0,
      item_brand: product.vendor || 'J. McLaughlin', // Product Brand
      item_category: categories.item_category || null,
      item_category2: categories.item_category2 || null,
      item_category3: categories.item_category3 || null,
      item_category4: sizeOption?.value || undefined, // Product Size | Option 1 (productGlobalObject)
      item_category5: colorOption?.value || undefined, // Product Color | Option 2 (productGlobalObject)
      item_variant: shopifyVariantId, // Product Variant ID
      item_carousel_title: undefined,
      item_list_id: 'Product Listing',
      item_list_name: 'Site Browse',
      location_id: 'Quick View',
      //price: product?.selectedVariant?.compareAtPrice?.amount
      // ? parseFloat(product.selectedVariant.compareAtPrice.amount)
      // : parseFloat(product.selectedVariant.price?.amount),
      price: price,
      quantity: 1,
      //item_sku: product.selectedVariant?.sku || "No Product SKU", // Product Sku originally
      item_variant_sku: product.parentSku?.value || undefined,
      item_variant_id: product.selectedVariant?.sku || undefined,
      //item_style_num: product.parentSku.value, // Item Style
      //item_shopify_id: shopifyProductId, //shopify Product GID
      item_shopify_id: itemParentVariantId,
      item_stock_message:
        product.selectedVariant?.quantityAvailable != null
          ? product.selectedVariant?.quantityAvailable > 0
            ? 'In Stock'
            : 'Out of Stock'
          : undefined,
      item_stock_quantity: product.selectedVariant?.quantityAvailable,
      item_style_number: product.styleNumber?.value || undefined,

    };

    //console.log('Constructed Item Data:', itemData);
    // Push event to dataLayer
    setTimeout(() => {
      window.ElevarDataLayer = window.ElevarDataLayer ?? [];
      window.ElevarDataLayer.push({ ecommerce: null });
      window.ElevarDataLayer.push({
        event: 'dl_quick_view_item',
        ecommerce: {
          event_details: {
            event_id: eventId, // Ensure this function generates a unique ID for the event
            content_group: 'Quick View',
            currency: globalCurrencyCode,
            value: product?.selectedVariant ? parseFloat(product.selectedVariant.price?.amount) : undefined,
            coupon: couponCode,
          },
          user_details: {
            log_state: getUserProperties(customer)?.visitor_type,
            //user_id: getUserProperties(customer)?.customer_id,
            total_spent: getUserProperties(customer)?.customer_total_spent,
            order_count: getUserProperties(customer)?.customer_order_count,
            customer_id: getUserProperties(customer)?.customer_id,
            enhanced_conversion: { // GOOGLE ADS ENHANCED CONVERSION
              email: getUserProperties(customer)?.customer_email, // Return the users email address
              phone_number: getUserProperties(customer)?.customer_phone, // Return the users phone number
              first_name: getUserProperties(customer)?.customer_first_name, // Return the users first name
              last_name: getUserProperties(customer)?.customer_last_name, // Return the users last name
              street: getUserProperties(customer)?.customer_address_1, // Return the users street address
              city: getUserProperties(customer)?.customer_city, // Return the users City
              state: getUserProperties(customer)?.customer_province, // Return the users state
              zip_code: getUserProperties(customer)?.customer_zip, // Return the users postal zip code
              country: getUserProperties(customer)?.customer_country // Return the users country
            },

          },
          items: [itemData],
        },
      });
    }, 3000);
    //console.log('quick_view_item event pushed to dataLayer successfully.', itemData);
  }
  catch (error) {
    console.error('Error in pushQuickViewItemEvent:', error);
  }
};

export const pushNewsletterSubscribe = (customer) => {

  window.ElevarDataLayer = window.ElevarDataLayer ?? [];

  if (customer.email !== '') {

    // Check for the gtm_user_data cookie
    let gtmUserDataCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('gtm_user_data='));

    // Parse existing cookie or create a new object
    let gtmUserData = gtmUserDataCookie
      ? JSON.parse(decodeURIComponent(gtmUserDataCookie.split('=')[1]))
      : {};

    // Check and update the 'em' field
    if (!gtmUserData.em) {
      gtmUserData.em = customer.email;

      // Set the updated cookie
      document.cookie = `gtm_user_data=${encodeURIComponent(JSON.stringify(gtmUserData))}; path=/;`;
    }


    window.ElevarDataLayer.push({
      event: 'dl_subscribe',
      lead_type: 'email', // should be "email" or "phone"
      user_properties: {
        customer_email: customer.email,
      },
    });
  }
/*
  if (customer.phone !== '') {
    window.ElevarDataLayer.push({
      event: 'dl_subscribe',
      lead_type: 'phone', // should be "email" or "phone"
      user_properties: {
        customer_phone: customer.phone,
      },
    });
  }
*/

};

//Fire Event on + and - action on cart Items

const buildItemArrayFromLine = (line, quantity) => {
  try {
    // Safeguards for line object and nested properties
    const merchandise = line?.merchandise || {};
    const product = merchandise?.product || {};
    const selectedOptions = merchandise?.selectedOptions || [];
    const globalCurrencyCode = getGlobalCurrencyCode() || 'USD';
    const couponCode = getDiscountCodes() || undefined;

    // Extract color and size from selectedOptions
    const colorOption =
      selectedOptions.find((option) => option.name === 'Color')?.value || undefined;
    const sizeOption =
      selectedOptions.find((option) => option.name === 'Size')?.value || undefined;

    // Safeguard for price and compareAtPrice
    const price = parseFloat(merchandise?.price?.amount) || 0;
    const compareAtPrice = parseFloat(merchandise?.compareAtPrice?.amount) || 0;
    const discount = compareAtPrice > 0 ? compareAtPrice - price : 0;

    // Safeguard for categories
    const categories = categorizeProduct(product?.title || '');
    const itemCategory = categories?.item_category || null;
    const itemCategory2 = categories?.item_category2 || null;
    const itemCategory3 = categories?.item_category3 || null;

    // Build and return the item array
    return [
      {
        item_id: stripGlobalId(product?.id) || undefined,
        item_name: product?.title || undefined,
        affiliation: 'Shopify Store',
        currency: globalCurrencyCode,
        coupon: couponCode,
        discount: discount,
        index: 0,
        item_brand: 'J. McLaughlin',
        item_category: itemCategory,
        item_category2: itemCategory2,
        item_category3: itemCategory3,
        item_category4: sizeOption,
        item_category5: colorOption,
        item_variant: stripGlobalId(merchandise?.id) || undefined,
        item_variant_sku: undefined,
        item_variant_id: merchandise?.sku || undefined,
        item_carousel_title: undefined,
        item_list_id: 'Product Listing',
        item_list_name: 'Site Browse',
        location_id: 'Cart',
        price: price,
        quantity: quantity?.toString() || '0',
        compare_at_price: compareAtPrice || undefined,
      },
    ];
  } catch (error) {
    console.error('Error building item array from line:', error);
    return [
      {
        item_id: undefined,
        item_name: undefined,
        affiliation: 'Shopify Store',
        currency: 'USD',
        coupon: undefined,
        discount: 0,
        index: 0,
        item_brand: undefined,
        item_category: undefined,
        item_category2: undefined,
        item_category3: undefined,
        item_category4: undefined,
        item_category5: undefined,
        item_variant: undefined,
        item_variant_sku: undefined,
        item_variant_id: undefined,
        item_carousel_title: undefined,
        item_list_id: undefined,
        item_list_name: undefined,
        location_id: undefined,
        price: 0,
        quantity: '0',
        compare_at_price: undefined,
      },
    ];
  }
};


export const pushAddToCartIncrease = (
  line,
  quantity,
  customer,
  currencyCode = 'USD',
  context = 'Increase Quantity',
) => {

  const items = buildItemArrayFromLine(line, quantity);

  // Delay execution slightly to allow flags to be updated
  setTimeout(() => {

    const couponCode = getDiscountCodes();

    const globalCurrencyCode = getGlobalCurrencyCode();
    // Calculate total value (price * quantity)
    const totalValue = parseFloat(items[0].price) * quantity;

    // Safeguard for invalid totalValue
    const finalValue = isNaN(totalValue) ? 0 : Math.round(totalValue * 100) / 100;
    const eventId = generateRandomId();

    window.ElevarDataLayer = window.ElevarDataLayer ?? [];
    window.ElevarDataLayer.push({ ecommerce: null });
    window.ElevarDataLayer.push({
      event: 'dl_add_to_cart',
      ecommerce: {
        event_details: {
          event_id: eventId,
          content_group: "Cart",
          currency: globalCurrencyCode,
          value: finalValue,
          coupon: couponCode,
          sku_count: 1,
          cart_qty: 1,
        },
        user_details: {
          log_state: getUserProperties(customer)?.visitor_type,
          //user_id: getUserProperties(customer)?.customer_id,
          total_spent: getUserProperties(customer)?.customer_total_spent,
          order_count: getUserProperties(customer)?.customer_order_count,
          customer_id: getUserProperties(customer)?.customer_id,
          enhanced_conversion: {                // GOOGLE ADS ENHANCED CONVERSION
            email: getUserProperties(customer)?.customer_email,       // Return the users email address
            phone_number: getUserProperties(customer)?.customer_phone,              // Return the users phone number
            first_name: getUserProperties(customer)?.customer_first_name,                    // Return the users first name
            last_name: getUserProperties(customer)?.customer_last_name,                     // Return the users last name
            street: getUserProperties(customer)?.customer_address_1,        // Return the users street address
            city: getUserProperties(customer)?.customer_city,                   // Return the users City
            state: getUserProperties(customer)?.customer_province,                             // Return the users state
            zip_code: getUserProperties(customer)?.customer_zip,                       // Return the users postal zip code
            country: getUserProperties(customer)?.customer_country                           // Return the users country
          },
        },
        items,
      },
    });
    //console.log('add_to_cart event pushed to dataLayer successfully:', items);
  }, 1200);
  // Set flag to suppress dl_view_item & dl_quick_view_item
  suppressViewItemEvent = true;// DO NOT CHANGE. Tied to the calculation of timings
  setTimeout(() => {
    suppressViewItemEvent = false;
  }, 4000); // Adjust timing if more events are introduced in future
};
export const pushRemoveCartDecrease = (
  line,
  quantity,
  customer,
  currencyCode = 'USD',
  context = 'Decrease Quantity',
) => {

  const items = buildItemArrayFromLine(line, quantity);

  // Delay execution slightly to allow flags to be updated
  setTimeout(() => {

    const couponCode = getDiscountCodes();

    const globalCurrencyCode = getGlobalCurrencyCode();
    // Calculate total value (price * quantity)
    const totalValue = parseFloat(items[0].price) * quantity;

    // Safeguard for invalid totalValue
    const finalValue = isNaN(totalValue) ? 0 : Math.round(totalValue * 100) / 100;
    const eventId = generateRandomId();

    window.ElevarDataLayer = window.ElevarDataLayer ?? [];
    window.ElevarDataLayer.push({ ecommerce: null });
    window.ElevarDataLayer.push({
      event: 'dl_remove_from_cart',
      ecommerce: {
        event_details: {
          event_id: eventId,
          content_group: "Cart",
          currency: globalCurrencyCode,
          value: finalValue,
          coupon: couponCode,
          sku_count: 1,
          cart_qty: 1,
        },
        user_details: {
          log_state: getUserProperties(customer)?.visitor_type,
          //user_id: getUserProperties(customer)?.customer_id,
          total_spent: getUserProperties(customer)?.customer_total_spent,
          order_count: getUserProperties(customer)?.customer_order_count,
          customer_id: getUserProperties(customer)?.customer_id,
          enhanced_conversion: {                // GOOGLE ADS ENHANCED CONVERSION
            email: getUserProperties(customer)?.customer_email,       // Return the users email address
            phone_number: getUserProperties(customer)?.customer_phone,              // Return the users phone number
            first_name: getUserProperties(customer)?.customer_first_name,                    // Return the users first name
            last_name: getUserProperties(customer)?.customer_last_name,                     // Return the users last name
            street: getUserProperties(customer)?.customer_address_1,        // Return the users street address
            city: getUserProperties(customer)?.customer_city,                   // Return the users City
            state: getUserProperties(customer)?.customer_province,                             // Return the users state
            zip_code: getUserProperties(customer)?.customer_zip,                       // Return the users postal zip code
            country: getUserProperties(customer)?.customer_country                           // Return the users country
          },
        },
        items,
      },
    });
    //console.log('remove_from_cart event pushed to dataLayer successfully:', items);
  }, 1200);
  // Set flag to suppress dl_view_item & dl_quick_view_item
  suppressViewItemEvent = true;// DO NOT CHANGE. Tied to the calculation of timings
  setTimeout(() => {
    suppressViewItemEvent = false;
  }, 4000); // Adjust timing if more events are introduced in future
};