import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';
import {useEffect, useMemo, useState} from 'react';

import {Link} from '~/components/Link';

type CartLines = {
  edges: {
    node: {
      merchandise: {
        product: {
          id: string;
          handle: string;
          title: string;
          metafield?: {value: string};
          image?: {url: string; altText: string};
        };
      };
    };
  }[];
};

export default function CompleteTheSet({linesObj}: {linesObj: CartLines}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1️⃣ Extract metafield values (GIDs) for "complete the set"
  const completeSetIds = useMemo(() => {
    if (!linesObj?.edges) return [];

    return linesObj.edges
      .map((edge) => edge.node.merchandise.product.metafield?.value)
      .filter(Boolean) as string[];
  }, [linesObj]);

  // 2️⃣ Extract cart product IDs to avoid duplicates
  const cartProductIds = useMemo(() => {
    return linesObj.edges.map((edge) => edge.node.merchandise.product.id);
  }, [linesObj]);

  useEffect(() => {
    if (!completeSetIds.length) return;

    const fetchProducts = async () => {
      setLoading(true);
      const fetched: any[] = [];

      for (const gid of completeSetIds) {
        if (cartProductIds.includes(gid)) continue;
        try {
          const res = await fetch(
            `/api/catalog/products/${encodeURIComponent(gid)}`,
          );
          const data = await res.json();
          if (data.product) fetched.push(data.product);
        } catch (err) {
          console.error('Error fetching product:', err);
        }
      }

      setProducts(fetched);
      setLoading(false);
    };

    fetchProducts();
  }, [completeSetIds, cartProductIds]);

  if (!completeSetIds.length || (products.length === 0 && !loading))
    return null;
  return (
    <div className="max-w-xl border-b border-t border-lightGray py-4">
      {loading && (
        <p className="text-gray-500 text-center text-sm">Loading...</p>
      )}
      {/* temporary -- only take the first item of the array */}
      {products.slice(0, 1).map((product) => (
        <div key={product.id} className="flex flex-row">
          <div className="flex flex-col items-center justify-center pr-2">
            <p className="text-base mb-4 block text-center font-bold italic">
              Complete The Look
            </p>
            <p className="text-center text-[12px] text-primary">
              {product.title}
            </p>
            <a
              href={`/products/${product.handle}`}
              className="mt-2 text-xs underline"
            >
              Shop Now
            </a>
          </div>
          <div className="mx-auto w-[55%] gap-4">
            <div className="flex flex-col items-center gap-2">
              {product.media.nodes.length > 0 && (
                <Link to={`/products/${product.handle}`}>
                  <Image
                    src={product.media.nodes[0].image.url}
                    alt={product.media.nodes[0].image.altText || product.title}
                    className="w-full object-cover"
                  />
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
