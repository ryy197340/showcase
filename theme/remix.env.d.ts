/// <reference types="@remix-run/dev" />
/// <reference types="@shopify/remix-oxygen" />
/// <reference types="@shopify/oxygen-workers-types" />

import type {Storefront} from '~/types/shopify';
import type {HydrogenSession} from '../server';
import type {SanityContext} from 'hydrogen-sanity';
import type {Cache, HydrogenCart} from '@shopify/hydrogen';
import type {IpData} from '~/types/shopify';
import { SwymApiClient } from '~/lib/swym/api/createSwymApiClient.server';

declare global {
  /**
   * A global `process` object is only available during build to access NODE_ENV.
   */
  const process: {env: {NODE_ENV: 'production' | 'development'}};

  /**
   * Declare expected Env parameter in fetch handler.
   */
  interface Env {
    SESSION_SECRET: string;
    PUBLIC_STOREFRONT_API_TOKEN: string;
    PRIVATE_STOREFRONT_API_TOKEN: string;
    PUBLIC_STOREFRONT_API_VERSION: string;
    PUBLIC_STORE_DOMAIN: string;
    PUBLIC_STOREFRONT_ID: string;
    SANITY_PROJECT_ID: string;
    SANITY_DATASET: string;
    SANITY_API_VERSION: string;
    SANITY_API_TOKEN: string;
    SANITY_PREVIEW_SECRET: string;
    RETURNS_PORTAL?: string;
    XGEN_CLIENT_ID?: string;
    XGEN_KEY?: string;
    XGEN_SECRET?: string;
    XGEN_TRACKER_ID?: string;
    WILDCARD_DOMAIN?:string;
    XGEN_DEPLOYMENT_ID?: string;
    XGEN_PLP_DEPLOYMENT_ID?: string;
    XGEN_HP_BEST_SELLERS_ID?: string;
    XGEN_TRENDING_ID?: string;
    APTOS_QTY_THRESHOLD?: string;
    APTOS_INVENTORY_LOOKUP_URL?: string;
    APTOS_API_BASEURL?:string;
    APTOS_CLIENT_NAME?:string;
    APTOS_API_GUID?:string;
    OMETRIA_STAGING_ACCOUNT: string;
    OMETRIA_PRODUCTION_ACCOUNT: string;
    PRIVATE_ADMIN_API_TOKEN: string;
    ECOM_LOCATION_ID: string;
  }

  interface Window {
    __XGEN_DEBUG_LOGS?: string[];
  }
}

/**
 * Declare local additions to `AppLoadContext` to include the session utilities we injected in `server.ts`.
 */
declare module '@shopify/remix-oxygen' {
  export interface AppLoadContext {
    session: HydrogenSession;
    waitUntil: ExecutionContext['waitUntil'];
    storefront: Storefront;
    cart: HydrogenCart;
    env: Env;
    sanity: SanityContext;
    ipData: IpData;
    localeData: any;
    adminApiClient: any;
    swymApiClient: SwymApiClient;
    xgenDebug?: {
      enabled: boolean;
      logs: string[];
      promise: Promise<string[]>;
    };
  }
}
