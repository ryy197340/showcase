import {CacheNone} from '@shopify/hydrogen';
import {v4 as uuidv4} from 'uuid';

import getSwymConfig from '~/lib/swym/swymconfig';
import {
  BIS_REG_ID,
  BIS_SESSION_ID,
  REG_ID,
  SESSION_ID,
} from '~/lib/swym/swymConstants';

interface Session {
  get: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
}

export interface SwymApiClient {
  generateRegId: (options?: {cache?: any}) => Promise<any>;
  createList: (lname?: string, options?: {cache?: any}) => Promise<any>;
  updateList: (
    productId: number,
    variantId: number,
    productUrl: string,
    lid: string,
    options?: {cache?: any},
  ) => Promise<any>;
  addToWishlist: (
    productId: number,
    variantId: number,
    productUrl: string,
    customLid?: string,
    options?: {cache?: any},
  ) => Promise<any>;
  removeFromWishlist: (
    productId: number,
    variantId: number,
    productUrl: string,
    listId: string,
    options?: {cache?: any},
  ) => Promise<any>;
  switchVariant: (
    productId: number,
    oldVariantId: number,
    newVariantId: number,
    productUrl: string,
    listId: string,
    options?: {cache?: any},
  ) => Promise<any>;
  fetchWishlist: (options?: {cache?: any}) => Promise<any>;
  fetchListWithContents: (lid: string, options?: {cache?: any}) => Promise<any>;
  guestValidateSync: (
    useremail?: string,
    options?: {cache?: any},
  ) => Promise<any>;
  guestValidateSyncBIS: (
    useremail?: string,
    options?: {cache?: any},
  ) => Promise<any>;
  fetchPublicList: (lid: string, options?: {cache?: any}) => Promise<any>;
  shareWishlistViaEmail: (
    publicLid: string,
    senderName: string,
    emailValue: string,
    note: string,
    options?: {cache?: any},
  ) => Promise<any>;
  copyWishlistLink: (
    publicLid: string,
    medium: string,
    shareListSenderName: string,
    options?: {cache?: any},
  ) => Promise<any>;
  deleteList: (lid: string, options?: {cache?: any}) => Promise<any>;
  createBackInStockSubscription: (
    product: {
      epi: number;
      empi: number;
      du: string;
    },
    medium: string,
    mediumValue: string,
    topics: string[],
    addToMailingList?: boolean,
    options?: {cache?: any},
  ) => Promise<any>;
  fetchBackInStockSubscriptions: (
    topic?: string,
    options?: {cache?: any},
  ) => Promise<any>;
}

export function createSwymApiClient({
  env,
  request,
  session,
}: {
  env: any;
  request: Request;
  session: any;
}): SwymApiClient {
  const SWYM_CONFIG = getSwymConfig(env);

  function base64Encode(str: string): string {
    try {
      return typeof Buffer !== 'undefined'
        ? Buffer.from(str).toString('base64')
        : btoa(str);
    } catch (error) {
      throw new Error(
        `Failed to base64 encode string: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function fetchWithErrorHandling(
    url: string,
    options: RequestInit,
    onRetry?: () => Promise<any>,
  ): Promise<any> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const clonedResponse = response.clone();
        try {
          const errorData = await clonedResponse.json();

          if (errorData?.type === 'sw-badregid') {
            session.set(REG_ID, null);
            session.set(SESSION_ID, null);
            if (onRetry) {
              return await onRetry();
            }
            throw new Error('Invalid regid. Please retry.');
          }

          throw new Error(
            errorData?.message ||
              `Request failed with status ${response.status}`,
          );
        } catch (parseError) {
          throw new Error(
            `Request failed with status ${
              response.status
            }: ${await response.text()}`,
          );
        }
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Network error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function ensureRegId(): Promise<void> {
    try {
      if (!session.get(SESSION_ID) || !session.get(REG_ID)) {
        await generateRegId();
      }
    } catch (error) {
      throw new Error(
        `Failed to ensure registration ID: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function ensureBISRegId(): Promise<void> {
    try {
      if (!session.get(BIS_SESSION_ID) || !session.get(BIS_REG_ID)) {
        await generateBISRegId();
      }
    } catch (error) {
      throw new Error(
        `Failed to ensure BIS registration ID: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function generateRegId(options: {cache?: any} = {}): Promise<any> {
    try {
      const useremail = session.get('customerEmail');

      const searchParams: Record<string, string> = {
        useragenttype: 'headlesswebApp',
        ...(useremail ? {useremail} : {uuid: uuidv4()}),
      };

      const response = await fetchWithErrorHandling(
        `${SWYM_CONFIG.SWYM_ENDPOINT}/storeadmin/v3/user/generate-regid`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${base64Encode(
              `${SWYM_CONFIG.PID}:${SWYM_CONFIG.REST_API_KEY}`,
            )}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(searchParams),
        },
      );

      session.set(SESSION_ID, response?.sessionid);
      session.set(REG_ID, response?.regid);
      return response;
    } catch (error) {
      session.set(SESSION_ID, null);
      session.set(REG_ID, null);
      throw new Error(
        `Failed to generate regid: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function generateBISRegId(options: {cache?: any} = {}): Promise<any> {
    try {
      const useremail = session.get('customerEmail');

      const searchParams: Record<string, string> = {
        useragenttype: 'headlesswebApp',
        ...(useremail ? {useremail} : {uuid: uuidv4()}),
      };

      const response = await fetchWithErrorHandling(
        `${SWYM_CONFIG.SWYM_ENDPOINT}/storeadmin/v3/user/generate-regid`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${base64Encode(
              `${SWYM_CONFIG.PID}:${SWYM_CONFIG.REST_API_KEY}`,
            )}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(searchParams),
        },
      );

      session.set(BIS_SESSION_ID, response?.sessionid);
      session.set(BIS_REG_ID, response?.regid);
      return response;
    } catch (error) {
      session.set(BIS_SESSION_ID, null);
      session.set(BIS_REG_ID, null);
      throw new Error(
        `Failed to generate BIS regid: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function createList(
    lname: string = SWYM_CONFIG.defaultWishlistName,
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      await ensureRegId();
      const sessionid = session.get(SESSION_ID);
      const regid = session.get(REG_ID);

      if (!sessionid || !regid) {
        throw new Error('Session ID or Reg ID not found');
      }

      const response = await fetchWithErrorHandling(
        `${
          SWYM_CONFIG.SWYM_ENDPOINT
        }/api/v3/lists/create?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'user-agent': 'headlesswebApp',
          },
          body: new URLSearchParams({lname, regid, sessionid}),
        },
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to create wishlist: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function deleteList(
    lid: string,
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      await ensureRegId();
      const sessionid = session.get(SESSION_ID);
      const regid = session.get(REG_ID);

      if (!sessionid || !regid) {
        throw new Error('Session ID or Reg ID not found');
      }

      const response = await fetchWithErrorHandling(
        `${
          SWYM_CONFIG.SWYM_ENDPOINT
        }/api/v3/lists/delete-list?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'user-agent': 'headlesswebApp',
          },
          body: new URLSearchParams({lid, regid, sessionid}),
        },
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to delete wishlist: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function updateList(
    productId: string,
    variantId: string,
    productUrl: string,
    lid: string,
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      await ensureRegId();
      const sessionid = session.get(SESSION_ID);
      const regid = session.get(REG_ID);

      if (!sessionid || !regid) {
        throw new Error('Session ID or Reg ID not found');
      }

      const response = await fetchWithErrorHandling(
        `${
          SWYM_CONFIG.SWYM_ENDPOINT
        }/api/v3/lists/update-ctx?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'user-agent': 'headlesswebApp',
          },
          body: new URLSearchParams({
            regid,
            sessionid,
            lid,
            a: `[{ "epi":${variantId}, "empi": ${productId}, "du":"${productUrl}" , "cprops": {"ou":"${productUrl}"}, "note": null, "qty": 1, "_cv": true }]`,
          }),
        },
        () => updateList(productId, variantId, productUrl, lid, options),
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to update wishlist: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function addToWishlist(
    productId: string,
    variantId: string,
    productUrl: string,
    customLid?: string,
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      if (customLid && customLid.trim() !== '' && customLid !== 'null') {
        return await updateList(productId, variantId, productUrl, customLid);
      }

      const wishlist = await fetchWishlist();
      const lid = wishlist?.[0]?.lid || (await createList()).lid;
      if (!lid) throw new Error('Failed to get valid wishlist ID');

      return await updateList(productId, variantId, productUrl, lid);
    } catch (error) {
      throw new Error(
        `Failed to add to wishlist: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function removeFromWishlist(
    productId: string,
    variantId: string,
    productUrl: string,
    listId: string,
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      await ensureRegId();
      const sessionid = session.get(SESSION_ID);
      const regid = session.get(REG_ID);

      if (!sessionid || !regid) {
        throw new Error('Session ID or Reg ID not found');
      }

      const response = await fetchWithErrorHandling(
        `${
          SWYM_CONFIG.SWYM_ENDPOINT
        }/api/v3/lists/update-ctx?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'user-agent': 'headlesswebApp',
          },
          body: new URLSearchParams({
            regid,
            sessionid,
            lid: listId,
            d: `[{ "epi":${variantId}, "empi": ${productId}, "du":"${productUrl}", "_cv": true }]`,
          }),
        },
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to remove from wishlist: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function switchVariant(
    productId: string,
    oldVariantId: string,
    newVariantId: string,
    productUrl: string,
    listId: string,
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      await ensureRegId();
      const sessionid = session.get(SESSION_ID);
      const regid = session.get(REG_ID);

      if (!sessionid || !regid) {
        throw new Error('Session ID or Reg ID not found');
      }

      // Perform atomic switch: remove old variant and add new variant in one request
      const response = await fetchWithErrorHandling(
        `${
          SWYM_CONFIG.SWYM_ENDPOINT
        }/api/v3/lists/update-ctx?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'user-agent': 'headlesswebApp',
          },
          body: new URLSearchParams({
            regid,
            sessionid,
            lid: listId,
            d: `[{ "epi":${oldVariantId}, "empi": ${productId}, "du":"${productUrl}", "_cv": true }]`,
            a: `[{ "epi":${newVariantId}, "empi": ${productId}, "du":"${productUrl}" , "cprops": {"ou":"${productUrl}"}, "note": null, "qty": 1, "_cv": true }]`,
          }),
        },
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to switch variant in wishlist: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function fetchWishlist(options: {cache?: any} = {}): Promise<any> {
    try {
      await ensureRegId();
      const sessionid = session.get(SESSION_ID);
      const regid = session.get(REG_ID);

      if (!sessionid || !regid) {
        throw new Error('Session ID or Reg ID not found');
      }

      const response = await fetchWithErrorHandling(
        `${
          SWYM_CONFIG.SWYM_ENDPOINT
        }/api/v3/lists/fetch-lists?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: new URLSearchParams({regid, sessionid}),
        },
        () => fetchWishlist(options),
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to fetch wishlist: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function fetchListWithContents(
    lid: string,
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      await ensureRegId();
      const sessionid = session.get(SESSION_ID);
      const regid = session.get(REG_ID);

      if (!sessionid || !regid) {
        throw new Error('Session ID or Reg ID not found');
      }

      const response = await fetchWithErrorHandling(
        `${
          SWYM_CONFIG.SWYM_ENDPOINT
        }/api/v3/lists/fetch-list-with-contents?pid=${encodeURIComponent(
          SWYM_CONFIG.PID,
        )}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: new URLSearchParams({regid, sessionid, lid}),
        },
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to fetch list with contents: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function guestValidateSync(
    useremail: string,
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      await ensureRegId();
      const email = useremail || session.get('customerEmail');
      const regid = session.get(REG_ID);
      if (!regid || !email) {
        throw new Error('Reg ID or Email not found');
      }

      const response = await fetchWithErrorHandling(
        `${SWYM_CONFIG.SWYM_ENDPOINT}/storeadmin/v3/user/guest-validate-sync`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${base64Encode(
              `${SWYM_CONFIG.PID}:${SWYM_CONFIG.REST_API_KEY}`,
            )}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            regid,
            useremail,
            useragenttype: 'headlesswebApp',
          }),
        },
      );

      session.set(REG_ID, response?.regid);
      return response;
    } catch (error) {
      throw new Error(
        `Failed to validate guest sync: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function guestValidateSyncBIS(
    useremail: string,
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      await ensureBISRegId();
      const email = useremail || session.get('customerEmail');
      const regid = session.get(BIS_REG_ID);
      if (!regid || !email) {
        throw new Error('BIS Reg ID or Email not found');
      }

      const response = await fetchWithErrorHandling(
        `${SWYM_CONFIG.SWYM_ENDPOINT}/storeadmin/v3/user/guest-validate-sync`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${base64Encode(
              `${SWYM_CONFIG.PID}:${SWYM_CONFIG.REST_API_KEY}`,
            )}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            regid,
            useremail,
            useragenttype: 'headlesswebApp',
          }),
        },
      );

      session.set(BIS_REG_ID, response?.regid);
      return response;
    } catch (error) {
      throw new Error(
        `Failed to validate BIS guest sync: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function fetchPublicList(
    lid: string,
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      await ensureRegId();
      const sessionid = session.get(SESSION_ID);
      const regid = session.get(REG_ID);

      if (!sessionid || !regid) {
        throw new Error('Session ID or Reg ID not found');
      }

      const response = await fetchWithErrorHandling(
        `${
          SWYM_CONFIG.SWYM_ENDPOINT
        }/api/v3/lists/markPublic?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: new URLSearchParams({regid, sessionid, lid}),
        },
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to fetch public list: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function shareWishlistViaEmail(
    publicLid: string,
    senderName: string,
    emailValue: string,
    note: string,
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      await ensureRegId();
      const sessionid = session.get(SESSION_ID);
      const regid = session.get(REG_ID);

      if (!sessionid || !regid) {
        throw new Error('Session ID or Reg ID not found');
      }

      const response = await fetchWithErrorHandling(
        `${
          SWYM_CONFIG.SWYM_ENDPOINT
        }/api/v3/lists/emailList?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: new URLSearchParams({
            lid: publicLid,
            regid,
            sessionid,
            note,
            fromname: senderName,
            toemail: emailValue,
          }),
        },
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to share wishlist via email: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function copyWishlistLink(
    publicLid: string,
    medium: string,
    shareListSenderName: string,
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      await ensureRegId();
      const sessionid = session.get(SESSION_ID);
      const regid = session.get(REG_ID);

      if (!sessionid || !regid) {
        throw new Error('Session ID or Reg ID not found');
      }

      const response = await fetchWithErrorHandling(
        `${
          SWYM_CONFIG.SWYM_ENDPOINT
        }/api/v3/lists/reportShare?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: new URLSearchParams({
            regid,
            sessionid,
            lid: publicLid,
            fromname: shareListSenderName,
            medium,
          }),
        },
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to copy wishlist link: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function createBackInStockSubscription(
    product: {
      epi: number;
      empi: number;
      du: string;
    },
    medium: string,
    mediumValue: string,
    topics: string[],
    addToMailingList = true,
    options: {cache?: any} = {},
  ): Promise<any> {
    // Validate required fields
    if (!product?.epi || !product?.empi || !product?.du) {
      throw new Error('Product epi, empi, and du are required');
    }
    if (!medium || !mediumValue) {
      throw new Error('Medium and mediumValue are required');
    }
    if (!topics || topics.length === 0) {
      throw new Error('At least one topic is required');
    }

    try {
      const response = await fetchWithErrorHandling(
        `${SWYM_CONFIG.SWYM_ENDPOINT}/storeadmin/bispa/subscriptions/create`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${base64Encode(
              `${SWYM_CONFIG.PID}:${SWYM_CONFIG.REST_API_KEY}`,
            )}`,
          },
          body: new URLSearchParams({
            products: `[{"epi":${product.epi}, "empi":${product.empi}, "du":"${product.du}", "_cv": "true"}]`,
            medium,
            mediumvalue: mediumValue,
            topics: JSON.stringify(topics),
            addtomailinglist: addToMailingList ? '1' : '0',
          }),
        },
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to create back-in-stock subscription: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function fetchBackInStockSubscriptions(
    topic = 'backinstock',
    options: {cache?: any} = {},
  ): Promise<any> {
    try {
      await ensureBISRegId();
      const sessionid = session.get(BIS_SESSION_ID);
      const regid = session.get(BIS_REG_ID);
      if (!sessionid || !regid) {
        throw new Error('Session ID or Reg ID not found');
      }

      const response = await fetchWithErrorHandling(
        `${
          SWYM_CONFIG.SWYM_ENDPOINT
        }/api/v3/subscriptions/fetch-subs?pid=${encodeURIComponent(
          SWYM_CONFIG.PID,
        )}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'user-agent': 'headlesswebApp',
          },
          body: new URLSearchParams({
            regid,
            sessionid,
            topic,
            limit: SWYM_CONFIG.backInStockSubscriptionsLimit.toString(),
          }),
        },
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to fetch back-in-stock subscriptions: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return {
    generateRegId,
    createList,
    deleteList,
    updateList,
    addToWishlist,
    removeFromWishlist,
    switchVariant,
    fetchWishlist,
    fetchListWithContents,
    guestValidateSync,
    guestValidateSyncBIS,
    fetchPublicList,
    shareWishlistViaEmail,
    copyWishlistLink,
    createBackInStockSubscription,
    fetchBackInStockSubscriptions,
  };
}
