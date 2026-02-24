import {Await} from '@remix-run/react';
import {flattenConnection} from '@shopify/hydrogen';
import type {Collection} from '@shopify/hydrogen/storefront-api-types';
import {Suspense} from 'react';

import ProductPill, {PillSkeleton} from '~/components/product/Pill';
import type {SanityNotFoundPage} from '~/lib/sanity';

import LocalizedA from './LocalizedA';

/**
 * A component that defines the content to display when a page isn't found (404 error)
 */

const LI_CLASSES = 'list-disc mb-10';

export function NotFound({
  notFoundPage,
  notFoundCollection,
}: {
  notFoundPage: SanityNotFoundPage;
  notFoundCollection?: Promise<{collection: Collection}>;
}) {
  return (
    <div className="flex flex-col gap-10 pt-15">
      <h1 className="page-width mx-auto px-12 text-center">
        {notFoundPage?.title || 'SOMETHING HAS GONE WRONG.'}
      </h1>

      <p className="my-8 text-center">
        {notFoundPage?.body || "DON'T WORRY, WE'RE FIXING IT RIGHT NOW."}
      </p>

      <ul className="page-width px-4 md:max-w-xl md:columns-2 md:gap-x-10 md:px-10">
        <li className={LI_CLASSES}>Try searching for your item</li>
        <li className={LI_CLASSES}>Select a new category from the main menu</li>
        <li className={LI_CLASSES}>Head to the homepage for a fresh start</li>
        <li className={LI_CLASSES}>
          For further assistance{' '}
          <LocalizedA href="/pages/contact-us">Contact Us</LocalizedA>
        </li>
      </ul>

      <h2 className="h3 page-width px-4 text-center md:px-10">
        WANT TO LOOK FOR SOMETHING NEW?
      </h2>
      {notFoundCollection && (
        <div className="mx-4 mb-18 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Suspense
            fallback={
              <>
                {Array(16)
                  .fill(true)
                  .map((_, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <PillSkeleton key={i} />
                  ))}
              </>
            }
          >
            <Await
              resolve={notFoundCollection}
              errorElement={<p>Error loading products!</p>}
            >
              {({collection}: {collection: Collection}) => {
                const products = flattenConnection(collection.products);

                return (
                  <>
                    {products?.map((product) => (
                      <div key={product.id}>
                        <ProductPill storefrontProduct={product} />
                      </div>
                    ))}
                  </>
                );
              }}
            </Await>
          </Suspense>
        </div>
      )}
      <LocalizedA
        href="/"
        className="m-auto flex h-12 w-[240px] items-center justify-center bg-primary px-4 py-2 text-[12px] uppercase text-white duration-200 ease-out hover:opacity-80"
      >
        Return to Homepage
      </LocalizedA>
    </div>
  );
}
