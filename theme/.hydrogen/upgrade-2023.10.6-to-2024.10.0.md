# Hydrogen upgrade guide: 2023.10.6 to 2024.10.0

----

## Features

### Stabilize getSitemap, getSitemapIndex and implement on skeleton [#2589](https://github.com/Shopify/hydrogen/pull/2589)

#### Step: 1. Update the getSitemapIndex at /app/routes/[sitemap.xml].tsx [#2589](https://github.com/Shopify/hydrogen/pull/2589)

[#2589](https://github.com/Shopify/hydrogen/pull/2589)
```diff
- import {unstable__getSitemapIndex as getSitemapIndex} from '@shopify/hydrogen';
+ import {getSitemapIndex} from '@shopify/hydrogen';
```


#### Step: 2. Update the getSitemap at /app/routes/sitemap.$type.$page[.xml].tsx [#2589](https://github.com/Shopify/hydrogen/pull/2589)

[#2589](https://github.com/Shopify/hydrogen/pull/2589)
```diff
- import {unstable__getSitemap as getSitemap} from '@shopify/hydrogen';
+ import {getSitemap} from '@shopify/hydrogen';
```


### H2O compatibility date [#2380](https://github.com/Shopify/hydrogen/pull/2380)

#### Check your project is working properly in an Oxygen deployment
[#2380](https://github.com/Shopify/hydrogen/pull/2380)

### Simplified creation of app context. [#2333](https://github.com/Shopify/hydrogen/pull/2333)

#### Step: 1. Create a app/lib/context file and use `createHydrogenContext` in it. [#2333](https://github.com/Shopify/hydrogen/pull/2333)

[#2333](https://github.com/Shopify/hydrogen/pull/2333)
```.ts
// in app/lib/context

import {createHydrogenContext} from '@shopify/hydrogen';

export async function createAppLoadContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
    const hydrogenContext = createHydrogenContext({
      env,
      request,
      cache,
      waitUntil,
      session,
      i18n: {language: 'EN', country: 'US'},
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
      // ensure to overwrite any options that is not using the default values from your server.ts
    });

  return {
    ...hydrogenContext,
    // declare additional Remix loader context
  };
}

```

#### Step: 2. Use `createAppLoadContext` method in server.ts Ensure to overwrite any options that is not using the default values in `createHydrogenContext` [#2333](https://github.com/Shopify/hydrogen/pull/2333)

[#2333](https://github.com/Shopify/hydrogen/pull/2333)
```diff
// in server.ts

- import {
-   createCartHandler,
-   createStorefrontClient,
-   createCustomerAccountClient,
- } from '@shopify/hydrogen';
+ import {createAppLoadContext} from '~/lib/context';

export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {

-   const {storefront} = createStorefrontClient(
-     ...
-   );

-   const customerAccount = createCustomerAccountClient(
-     ...
-   );

-   const cart = createCartHandler(
-     ...
-   );

+   const appLoadContext = await createAppLoadContext(
+      request,
+      env,
+      executionContext,
+   );

    /**
      * Create a Remix request handler and pass
      * Hydrogen's Storefront client to the loader context.
      */
    const handleRequest = createRequestHandler({
      build: remixBuild,
      mode: process.env.NODE_ENV,
-      getLoadContext: (): AppLoadContext => ({
-        session,
-        storefront,
-        customerAccount,
-        cart,
-        env,
-        waitUntil,
-      }),
+      getLoadContext: () => appLoadContext,
    });
  }
```

#### Step: 3. Use infer type for AppLoadContext in env.d.ts [#2333](https://github.com/Shopify/hydrogen/pull/2333)

[#2333](https://github.com/Shopify/hydrogen/pull/2333)
```diff
// in env.d.ts

+ import type {createAppLoadContext} from '~/lib/context';

+ interface AppLoadContext extends Awaited<ReturnType<typeof createAppLoadContext>> {
- interface AppLoadContext {
-  env: Env;
-  cart: HydrogenCart;
-  storefront: Storefront;
-  customerAccount: CustomerAccount;
-  session: AppSession;
-  waitUntil: ExecutionContext['waitUntil'];
}

```

### Optimistic variant [#2113](https://github.com/Shopify/hydrogen/pull/2113)

#### Step: 1. Example of product display page update [#2113](https://github.com/Shopify/hydrogen/pull/2113)

[#2113](https://github.com/Shopify/hydrogen/pull/2113)
```.tsx
function Product() {
  const {product, variants} = useLoaderData<typeof loader>();

  // The selectedVariant optimistically changes during page
  // transitions with one of the preloaded product variants
  const selectedVariant = useOptimisticVariant(
    product.selectedVariant,
    variants,
  );

  return <ProductMain selectedVariant={selectedVariant} />;
}
```

#### Step: 2. Optional <VariantSelector /> update [#2113](https://github.com/Shopify/hydrogen/pull/2113)

[#2113](https://github.com/Shopify/hydrogen/pull/2113)
```diff
<VariantSelector
  handle={product.handle}
  options={product.options}
+  waitForNavigation
>
  ...
</VariantSelector>
```

### [Breaking Change] New session commit pattern [#2137](https://github.com/Shopify/hydrogen/pull/2137)

#### Step: 1. Add isPending implementation in session [#2137](https://github.com/Shopify/hydrogen/pull/2137)

[#2137](https://github.com/Shopify/hydrogen/pull/2137)
```diff
// in app/lib/session.ts
export class AppSession implements HydrogenSession {
+  public isPending = false;

  get unset() {
+    this.isPending = true;
    return this.#session.unset;
  }

  get set() {
+    this.isPending = true;
    return this.#session.set;
  }

  commit() {
+    this.isPending = false;
    return this.#sessionStorage.commitSession(this.#session);
  }
}
```

#### Step: 2. update response header if `session.isPending` is true [#2137](https://github.com/Shopify/hydrogen/pull/2137)

[#2137](https://github.com/Shopify/hydrogen/pull/2137)
```diff
// in server.ts
export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const response = await handleRequest(request);

+      if (session.isPending) {
+        response.headers.set('Set-Cookie', await session.commit());
+      }

      return response;
    } catch (error) {
      ...
    }
  },
};
```

#### Step: 3. remove setting cookie with `session.commit()` in routes [#2137](https://github.com/Shopify/hydrogen/pull/2137)

[#2137](https://github.com/Shopify/hydrogen/pull/2137)
```diff
// in route files
export async function loader({context}: LoaderFunctionArgs) {
  return json({},
-    {
-      headers: {
-        'Set-Cookie': await context.session.commit(),
-      },
    },
  );
}
```

### Add `@shopify/mini-oxygen` as a dev dependency for local development [#1891](https://github.com/Shopify/hydrogen/pull/1891)

#### package.json
[#1891](https://github.com/Shopify/hydrogen/pull/1891)
```diff
 "devDependencies": {
    "@remix-run/dev": "^2.8.0",
    "@remix-run/eslint-config": "^2.8.0",
+   "@shopify/mini-oxygen": "^3.0.0",
    "@shopify/oxygen-workers-types": "^4.0.0",
    ...
  }
```

### Support scaffolding projects from external repositories using the `--template` flag [#1867](https://github.com/Shopify/hydrogen/pull/1867)

#### The following examples are equivalent
[#1867](https://github.com/Shopify/hydrogen/pull/1867)
```bash
npm create @shopify/hydrogen -- --template shopify/hydrogen-demo-store
npm create @shopify/hydrogen -- --template github.com/shopify/hydrogen-demo-store
npm create @shopify/hydrogen -- --template https://github.com/shopify/hydrogen-demo-store
```

### Deprecate the `<Seo />` component in favor of directly using Remix meta route exports [#1875](https://github.com/Shopify/hydrogen/pull/1875)

#### Step: 1. Remove the `<Seo />` component from `root.jsx` [#1875](https://github.com/Shopify/hydrogen/pull/1875)

[#1875](https://github.com/Shopify/hydrogen/pull/1875)
```diff
export default function App() {
   const nonce = useNonce();
   const data = useLoaderData<typeof loader>();

   return (
     <html lang="en">
       <head>
         <meta charSet="utf-8" />
         <meta name="viewport" content="width=device-width,initial-scale=1" />
-        <Seo />
         <Meta />
         <Links />
       </head>
       <body>
         <Layout {...data}>
           <Outlet />
         </Layout>
         <ScrollRestoration nonce={nonce} />
         <Scripts nonce={nonce} />
         <LiveReload nonce={nonce} />
       </body>
     </html>
   );
 }
```

#### Step: 2. Add a Remix meta export to each route that returns an seo property from a loader or handle: [#1875](https://github.com/Shopify/hydrogen/pull/1875)

[#1875](https://github.com/Shopify/hydrogen/pull/1875)
```diff
+import {getSeoMeta} from '@shopify/hydrogen';

 export async function loader({context}) {
   const {shop} = await context.storefront.query(`
     query layout {
       shop {
         name
         description
       }
     }
   `);

   return {
     seo: {
       title: shop.title,
       description: shop.description,
     },
   };
 }

+export const meta = ({data}) => {
+   return getSeoMeta(data.seo);
+};
```

#### Step: 3. Merge root route meta data [#1875](https://github.com/Shopify/hydrogen/pull/1875)

[#1875](https://github.com/Shopify/hydrogen/pull/1875)
If your root route loader also returns an seo property, make sure to merge that data:

```js
export const meta = ({data, matches}) => {
  return getSeoMeta(
    matches[0].data.seo,
    // the current route seo data overrides the root route data
    data.seo,
  );
};
```
Or more simply:

```js
export const meta = ({data, matches}) => {
  return getSeoMeta(...matches.map((match) => match.data.seo));
};
```

#### Step: 4. Override meta [#1875](https://github.com/Shopify/hydrogen/pull/1875)

[#1875](https://github.com/Shopify/hydrogen/pull/1875)
Sometimes getSeoMeta might produce a property in a way you'd like to change. Map over the resulting array to change it. For example, Hydrogen removes query parameters from canonical URLs, add them back:

```js
export const meta = ({data, location}) => {
  return getSeoMeta(data.seo).map((meta) => {
    if (meta.rel === 'canonical') {
      return {
        ...meta,
        href: meta.href + location.search,
      };
    }

    return meta;
  });
};
```

### Codegen dependencies must be now listed explicitly in package.json [#1962](https://github.com/Shopify/hydrogen/pull/1962)

#### Update package.json
[#1962](https://github.com/Shopify/hydrogen/pull/1962)
```diff
{
  "devDependencies": {
+   "@graphql-codegen/cli": "5.0.2",
    "@remix-run/dev": "^2.8.0",
    "@remix-run/eslint-config": "^2.8.0",
+   "@shopify/hydrogen-codegen": "^0.3.0",
    "@shopify/mini-oxygen": "^2.2.5",
    "@shopify/oxygen-workers-types": "^4.0.0",
    ...
  }
}
```

### Update the GraphQL config in .graphqlrc.yml to use the more modern projects structure: [#1577](https://github.com/Shopify/hydrogen/pull/1577)

#### Step: 1. This allows you to add additional projects to the GraphQL config, such as third party CMS schemas. [#1577](https://github.com/Shopify/hydrogen/pull/1577)

[#1577](https://github.com/Shopify/hydrogen/pull/1577)
```diff
-schema: node_modules/@shopify/hydrogen/storefront.schema.json
+projects:
+ default:
+    schema: 'node_modules/@shopify/hydrogen/storefront.schema.json
```

#### Step: 2. Also, you can modify the document paths used for the Storefront API queries. This is useful if you have a large codebase and want to exclude certain files from being used for codegen or other GraphQL utilities: [#1577](https://github.com/Shopify/hydrogen/pull/1577)

[#1577](https://github.com/Shopify/hydrogen/pull/1577)
 ```yaml
    projects:
      default:
        schema: 'node_modules/@shopify/hydrogen/storefront.schema.json'
        documents:
          - '!*.d.ts'
          - '*.{ts,tsx,js,jsx}'
          - 'app/**/*.{ts,tsx,js,jsx}'
    ```

### Use new `variantBySelectedOptions` parameters introduced in Storefront API v2024-01 to fix redirection to the product's default variant when there are unknown query params in the URL. [#1642](https://github.com/Shopify/hydrogen/pull/1642)

#### Update the `product` query to include the `variantBySelectedOptions` parameters `ignoreUnknownOptions` and `caseInsensitiveMatch`
[#1642](https://github.com/Shopify/hydrogen/pull/1642)
```diff
-   selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
+   selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
```

### Better Hydrogen error handling [#1645](https://github.com/Shopify/hydrogen/pull/1645)

#### Changed the shape of the error objects returned by createCartHandler. Previously, mutations could return an errors array that contained a userErrors array. With this change, these arrays are no longer nested. The response can contain both an errors array and a userErrors array. errors contains GraphQL execution errors. userErrors contains errors caused by the cart mutation itself (such as adding a product that has zero inventory). storefront.isApiError is deprecated.
[#1645](https://github.com/Shopify/hydrogen/pull/1645)
```diff
- const data = await context.storefront.query(EXAMPLE_QUERY)
+ const {data, errors, userErrors} = await context.storefront.query(EXAMPLE_QUERY) 
```

```diff
- const cart = await context.cart.get()
+ const {cart, errors, userErrors} = await context.cart.get()
```

### Add deploy command to Hydrogen CLI [#1628](https://github.com/Shopify/hydrogen/pull/1628)

#### Use the new `h2 deploy` command to deploy your app
[#1628](https://github.com/Shopify/hydrogen/pull/1628)
```bash
npx shopify hydrogen deploy --help
```

### Add `--template` flag to enable scaffolding projects based on examples from the Hydrogen repo [#1608](https://github.com/Shopify/hydrogen/pull/1608)

#### Use the new `--template` flag to scaffold your app
[#1608](https://github.com/Shopify/hydrogen/pull/1608)
```bash
npm create @shopify/hydrogen@latest -- --template multipass
```

### Make the worker runtime the default environment for the local dev and preview. [#1625](https://github.com/Shopify/hydrogen/pull/1625)

#### To access the legacy Node.js runtime, pass the --legacy-runtime flag. The legacy runtime will be deprecated and removed in a future release.
[#1625](https://github.com/Shopify/hydrogen/pull/1625)
```diff
"scripts": {
-   "dev": "shopify hydrogen dev --codegen",
+   "dev": "shopify hydrogen dev --codegen --legacy-runtime",
-    "preview": "npm run build && shopify hydrogen preview",
+    "preview": "npm run build && shopify hydrogen preview --legacy-runtime",
}
```

### Make default HydrogenSession type extensible [#1590](https://github.com/Shopify/hydrogen/pull/1590)

#### New HydrogenSession type
[#1590](https://github.com/Shopify/hydrogen/pull/1590)
```diff
import {
+ type HydrogenSession,
} from '@shopify/hydrogen';

- class HydrogenSession {
+ class AppSession implements HydrogenSession {
    ...
}
```

----

----

## Fixes

### Make set up cookie banner by default to false [#2588](https://github.com/Shopify/hydrogen/pull/2588)

#### If you are using Shopify's cookie banner to handle user consent in your app, you need to set `withPrivacyBanner: true` to the consent config. Without this update, the Shopify cookie banner will not appear.
[#2588](https://github.com/Shopify/hydrogen/pull/2588)
```diff
  return defer({
    ...
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
+      withPrivacyBanner: true,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  });
```


### Deprecate usages of product.options.values and use product.options.optionValues instead [#2585](https://github.com/Shopify/hydrogen/pull/2585)

#### Step: 1. Update your product graphql query to use the new `optionValues` field [#2585](https://github.com/Shopify/hydrogen/pull/2585)

[#2585](https://github.com/Shopify/hydrogen/pull/2585)
```diff
  const PRODUCT_FRAGMENT = `#graphql
    fragment Product on Product {
      id
      title
      options {
        name
-        values
+        optionValues {
+          name
+        }
      }
```


#### Step: 2. Update your `<VariantSelector>` to use the new `optionValues` field [#2585](https://github.com/Shopify/hydrogen/pull/2585)

[#2585](https://github.com/Shopify/hydrogen/pull/2585)
```diff
  <VariantSelector
    handle={product.handle}
-    options={product.options.filter((option) => option.values.length > 1)}
+    options={product.options.filter((option) => option.optionValues.length > 1)}
    variants={variants}
  >
```


### Update all cart mutation methods from createCartHandler to return cart warnings [#2572](https://github.com/Shopify/hydrogen/pull/2572)

#### Check warnings for stock levels
[#2572](https://github.com/Shopify/hydrogen/pull/2572)

### Update createWithCache to make it harder to accidentally cache undesired results [#2546](https://github.com/Shopify/hydrogen/pull/2546)

#### Step: 1. request is now a mandatory prop when initializing createWithCache. [#2546](https://github.com/Shopify/hydrogen/pull/2546)

[#2546](https://github.com/Shopify/hydrogen/pull/2546)
```diff
// server.ts
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      // ...
-     const withCache = createWithCache({cache, waitUntil});
+     const withCache = createWithCache({cache, waitUntil, request});
```


#### Step: 2. New `withCache.fetch` is for caching simple fetch requests. This method caches the responses if they are OK responses, and you can pass `shouldCacheResponse`, `cacheKey`, etc. to modify behavior. `data` is the consumed body of the response (we need to consume to cache it). [#2546](https://github.com/Shopify/hydrogen/pull/2546)

[#2546](https://github.com/Shopify/hydrogen/pull/2546)
```ts
  const withCache = createWithCache({cache, waitUntil, request});

  const {data, response} = await withCache.fetch<{data: T; error: string}>(
    'my-cms.com/api',
    {
      method: 'POST',
      headers: {'Content-type': 'application/json'},
      body,
    },
    {
      cacheStrategy: CacheLong(),
      // Cache if there are no data errors or a specific data that make this result not suited for caching
      shouldCacheResponse: (result) => !result?.error,
      cacheKey: ['my-cms', body],
      displayName: 'My CMS query',
    },
  );
```


#### Step: 3. The original `withCache` callback function is now `withCache.run`. This is useful to run *multiple* fetch calls and merge their responses, or run any arbitrary code. It caches anything you return, but you can throw if you don't want to cache anything. [#2546](https://github.com/Shopify/hydrogen/pull/2546)

[#2546](https://github.com/Shopify/hydrogen/pull/2546)
```diff
  const withCache = createWithCache({cache, waitUntil, request});

  const fetchMyCMS = (query) => {
-    return withCache(['my-cms', query], CacheLong(), async (params) => {
+    return withCache.run({
+      cacheKey: ['my-cms', query],
+      cacheStrategy: CacheLong(),
+      // Cache if there are no data errors or a specific data that make this result not suited for caching
+      shouldCacheResult: (result) => !result?.errors,
+    }, async(params) => {
      const response = await fetch('my-cms.com/api', {
        method: 'POST',
        body: query,
      });
      if (!response.ok) throw new Error(response.statusText);
      const {data, error} = await response.json();
      if (error || !data) throw new Error(error ?? 'Missing data');
      params.addDebugData({displayName: 'My CMS query', response});
      return data;
    });
  };
```


### Fix an infinite redirect when viewing the cached version of a Hydrogen site on Google Web Cache [#2334](https://github.com/Shopify/hydrogen/pull/2334)

#### Update your entry.client.jsx file to include this check
[#2334](https://github.com/Shopify/hydrogen/pull/2334)
```diff
+ if (!window.location.origin.includes("webcache.googleusercontent.com")) {
   startTransition(() => {
     hydrateRoot(
       document,
       <StrictMode>
         <RemixBrowser />
       </StrictMode>
     );
   });
+ }
```

### Remix upgrade and use Layout component in root file. This new pattern will eliminate the use of useLoaderData in ErrorBoundary and clean up the root file of duplicate code. [#2290](https://github.com/Shopify/hydrogen/pull/2290)

#### Step: 1. Refactor App export to become Layout export [#2290](https://github.com/Shopify/hydrogen/pull/2290)

[#2290](https://github.com/Shopify/hydrogen/pull/2290)
```diff
-export default function App() {
+export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
-  const data = useLoaderData<typeof loader>();
+  const data = useRouteLoaderData<typeof loader>('root');

  return (
    <html>
    ...
      <body>
-        <Layout {...data}>
-          <Outlet />
-        </Layout>
+        {data? (
+          <PageLayout {...data}>{children}</PageLayout>
+         ) : (
+          children
+        )}
      </body>
    </html>
  );
}
```

#### Step: 2. Simplify default App export [#2290](https://github.com/Shopify/hydrogen/pull/2290)

[#2290](https://github.com/Shopify/hydrogen/pull/2290)
```diff
+export default function App() {
+  return <Outlet />;
+}
```

#### Step: 3. Remove wrapping layout from ErrorBoundary [#2290](https://github.com/Shopify/hydrogen/pull/2290)

[#2290](https://github.com/Shopify/hydrogen/pull/2290)
```diff
export function ErrorBoundary() {
- const rootData = useLoaderData<typeof loader>();

  return (
-    <html>
-    ...
-      <body>
-        <Layout {...rootData}>
-          <div className="route-error">
-            <h1>Error</h1>
-            ...
-          </div>
-        </Layout>
-      </body>
-    </html>
+    <div className="route-error">
+      <h1>Error</h1>
+      ...
+    </div>
  );
}
```

### [Breaking Change] `<VariantSelector />` improved handling of options [#1198](https://github.com/Shopify/hydrogen/pull/1198)

#### Update options prop when using <VariantSelector />
[#1198](https://github.com/Shopify/hydrogen/pull/1198)
```diff
 <VariantSelector
   handle={product.handle}
+  options={product.options.filter((option) => option.values.length > 1)}
-  options={product.options}
   variants={variants}>
 </VariantSelector>
```

### Fix a bug where cart could be null, even though a new cart was created by adding a line item. [#1865](https://github.com/Shopify/hydrogen/pull/1865)

#### Example
[#1865](https://github.com/Shopify/hydrogen/pull/1865)
```ts
import {
  createCartHandler,
  cartGetIdDefault,
  cartSetIdDefault,
} from '@shopify/hydrogen';

const cartHandler = createCartHandler({
  storefront,
  getCartId: cartGetIdDefault(request.headers),
  setCartId: cartSetIdDefault(),
  cartQueryFragment: CART_QUERY_FRAGMENT,
  cartMutateFragment: CART_MUTATE_FRAGMENT,
});

await cartHandler.addLines([{merchandiseId: '...'}]);
// .get() now returns the cart as expected
const cart = await cartHandler.get();
```

### Update Vite plugin imports, and how their options are passed to Remix [#1935](https://github.com/Shopify/hydrogen/pull/1935)

#### vite.config.js
[#1935](https://github.com/Shopify/hydrogen/pull/1935)
```diff
-import {hydrogen, oxygen} from '@shopify/cli-hydrogen/experimental-vite';
+import {hydrogen} from '@shopify/hydrogen/vite';
+import {oxygen} from '@shopify/mini-oxygen/vite';
import {vitePlugin as remix} from '@remix-run/dev';

export default defineConfig({
    hydrogen(),
    oxygen(),
    remix({
-     buildDirectory: 'dist',
+     presets: [hydrogen.preset()],
      future: {
```

### Change `storefrontRedirect` to ignore query parameters when matching redirects [#1900](https://github.com/Shopify/hydrogen/pull/1900)

#### This is a breaking change. If you want to retain the legacy functionality that is query parameter sensitive, pass matchQueryParams to storefrontRedirect():
[#1900](https://github.com/Shopify/hydrogen/pull/1900)
```js
storefrontRedirect({
  request,
  response,
  storefront,
+  matchQueryParams: true,
});
```

### Fix types returned by the session object [#1869](https://github.com/Shopify/hydrogen/pull/1869)

#### In remix.env.d.ts or env.d.ts, add the following types
[#1869](https://github.com/Shopify/hydrogen/pull/1869)
```diff
import type {
  // ...
  HydrogenCart,
+ HydrogenSessionData,
} from '@shopify/hydrogen';

// ...

declare module '@shopify/remix-oxygen' {
  // ...

+ interface SessionData extends HydrogenSessionData {}
}
```

### Fix 404 not working on certain unknown and i18n routes [#1732](https://github.com/Shopify/hydrogen/pull/1732)

#### Add a `($locale).tsx` route with the following contents
[#1732](https://github.com/Shopify/hydrogen/pull/1732)
```js
import {type LoaderFunctionArgs} from '@remix-run/server-runtime';

export async function loader({params, context}: LoaderFunctionArgs) {
  const {language, country} = context.storefront.i18n;

  if (
    params.locale &&
    params.locale.toLowerCase() !== `${language}-${country}`.toLowerCase()
  ) {
    // If the locale URL param is defined, yet we still are still at the default locale
    // then the the locale param must be invalid, send to the 404 page
    throw new Response(null, {status: 404});
  }

  return null;
}
```

### Use new `variantBySelectedOptions` parameters introduced in Storefront API v2024-01 to fix redirection to the product's default variant when there are unknown query params in the URL. [#1642](https://github.com/Shopify/hydrogen/pull/1642)

#### Update the `product` query to include the `variantBySelectedOptions` parameters `ignoreUnknownOptions` and `caseInsensitiveMatch`
[#1642](https://github.com/Shopify/hydrogen/pull/1642)
```diff
-   selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
+   selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
```
