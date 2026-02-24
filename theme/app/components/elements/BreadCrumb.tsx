import {Product} from '@shopify/hydrogen/storefront-api-types';

import {Link} from '../Link';
type Props = {
  storefrontProduct?: Product;
  isAccountPage?: boolean;
};
export default function Breadcrumb({storefrontProduct}: Props) {
  // set up an array that grabs the display titles and their handles
  function getBreadcrumbs(breadcrumbNodes = []) {
    if (!Array.isArray(breadcrumbNodes)) return [];

    return breadcrumbNodes
      .map((node) => {
        const handle = node?.handle?.trim?.();
        const displayTitle = node?.breadcrumbDisplayTitle?.value?.trim?.();

        if (handle || displayTitle) {
          return {handle, displayTitle};
        }
        return null;
      })
      .filter(Boolean);
  }

  const pdpBreadcrumbNodesArray =
    storefrontProduct?.pdpBreadcrumb?.references.nodes || [];

  const breadcrumbs = getBreadcrumbs(pdpBreadcrumbNodesArray);

  return (
    <div
      className={`w-full pb-[14px] ${
        storefrontProduct ? 'md:pt-[30px]' : 'text-center'
      } flex flex-wrap gap-1 text-2xs text-primary lg:pb-8`}
    >
      {/* Home link */}
      <Link to="/">
        <span>Home</span>
      </Link>

      {/* Map through breadcrumb collections if any */}
      {breadcrumbs.length > 0 &&
        breadcrumbs.map(({handle, displayTitle}, index) => (
          <span key={handle || index} className="flex items-center gap-1">
            <span>|</span>
            <Link to={`/collections/${handle}`}>
              <span>{displayTitle || handle}</span>
            </Link>
          </span>
        ))}

      {/* Product link */}
      {breadcrumbs.length === 0 && storefrontProduct && (
        <span className="flex items-center gap-1">
          <span>|</span>
          <Link to={`/products/${storefrontProduct.handle}`}>
            <span className="text-primary">{storefrontProduct.title}</span>
          </Link>
        </span>
      )}

      {/* Account Link if not a product */}
      {!storefrontProduct && (
        <span className="flex items-center gap-1">
          <span>|</span>
          <Link to={`/account`}>
            <span className="text-primary">Account</span>
          </Link>
        </span>
      )}
    </div>
  );
}
