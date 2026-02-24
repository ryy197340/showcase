import {RecommendProduct} from '@xgenai/sdk-core';
import clsx from 'clsx';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {squareButtonStyles} from '~/components/elements/Button';
import {useSwymContext} from '~/lib/swym/context/SwymContext';
import {GlobalContext} from '~/lib/utils';
import {normalizeProductLink} from '~/lib/xgen/utils/normalizeProductLink';

import SignInPopup from './SignInPopup';
import WishlistIcon from './WishlistIcon';

interface AddToWishlistButtonProps {
  product: any;
  selectedVariant?: any;
  buttonType?: 'button' | 'icon' | 'icon-text';
  buttonSource?: 'pdp' | 'plp' | 'quick-view' | 'recos';
  iconHeight?: number;
  iconWidth?: number;
}

const AddToWishlistButton: React.FC<AddToWishlistButtonProps> = ({
  product,
  selectedVariant,
  buttonType = 'icon',
  buttonSource = 'pdp',
  iconHeight = 17,
  iconWidth = 17,
}) => {
  const {
    lid,
    isWishlisted,
    isProductWishlisted,
    wishlist,
    fetchWishlist,
    setShowLoginPopup,
    setLoginPopupButtonSource,
    setWishlistNotification,
    setShowWishlistNotification,
  } = useSwymContext();
  const {isAuthenticated} = useContext(GlobalContext);
  const [showLoginPopupOnPlp, setShowLoginPopupOnPlp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [productId, setProductId] = useState<number>();
  const [variantId, setVariantId] = useState<number>();
  const [productUrl, setProductUrl] = useState<string>();
  const [actionType, setActionType] = useState<'adding' | 'removing' | null>(
    null,
  );

  const getWishlistedVariantId = useCallback((): number | undefined => {
    if (!wishlist || !productId) return undefined;
    return wishlist.listcontents?.find((item) => item.empi === productId)?.epi;
  }, [wishlist, productId]);

  const wishlistedVariantId = getWishlistedVariantId();
  const isCurrentVariantWishlisted =
    wishlisted && wishlistedVariantId === variantId;

  const getProductUrl = useCallback((): string | undefined => {
    // XGen product type
    if (product?.link) {
      return `${window.location.origin}${normalizeProductLink(product.link)}`;
    }

    // Shopify product type
    if (product?.handle) {
      return `${window.location.origin}/products/${product.handle}`;
    }

    return undefined;
  }, [product]);

  const getProductId = useCallback((): number | undefined => {
    // XGen product type
    if (Number(product?.prod_code)) {
      return Number(product.prod_code);
    }

    // Shopify product type
    if (product?.id) {
      const idParts = product.id.split('Product/');
      return idParts[1] ? Number(idParts[1]) : undefined;
    }

    return undefined;
  }, [product]);

  const getProductVariantId = useCallback((): number | undefined => {
    // XGen product type
    if (Number(product?.prod_code)) {
      return Number(product.prod_code);
    }

    // Shopify product type
    if (selectedVariant?.id) {
      const idParts = selectedVariant.id.split('ProductVariant/');
      return idParts[1] ? Number(idParts[1]) : undefined;
    }
    if (product?.variation_id) {
      return Number(product.variation_id);
    }
    if (product?.selectedVariant?.id) {
      const idParts = product.selectedVariant.id.split('ProductVariant/');
      return idParts[1] ? Number(idParts[1]) : undefined;
    }
    const firstAvailableVariant = product?.variants?.nodes?.find(
      (variant: any) => variant.availableForSale,
    );
    if (firstAvailableVariant) {
      const idParts = firstAvailableVariant.id.split('ProductVariant/');
      return idParts[1] ? Number(idParts[1]) : undefined;
    }

    if (product?.variants?.nodes?.[0]?.id) {
      const idParts = product.variants.nodes[0].id.split('ProductVariant/');
      return idParts[1] ? Number(idParts[1]) : undefined;
    }
    return undefined;
  }, [selectedVariant, product]);

  useEffect(() => {
    const id = getProductId();
    const variant = getProductVariantId();
    const url = getProductUrl();

    setProductId(id);
    setVariantId(variant);
    setProductUrl(url);
  }, [product, selectedVariant]);

  useEffect(() => {
    if (
      !product ||
      !wishlist ||
      productId === undefined ||
      variantId === undefined
    )
      return;

    const isItemWishlisted =
      buttonSource === 'plp' || buttonSource === 'recos'
        ? isProductWishlisted(productId)
        : isWishlisted(productId, variantId);
    setWishlisted(isItemWishlisted);
  }, [
    product,
    wishlist,
    productId,
    variantId,
    isWishlisted,
    isProductWishlisted,
    buttonSource,
  ]);

  const handleWishlistAction = async (
    event: React.MouseEvent,
    action: 'add' | 'remove',
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!productId || !variantId || !productUrl) {
      console.error(`Missing required product details for ${action}`);
      return;
    }

    setActionType(action === 'add' ? 'adding' : 'removing');
    setLoading(true);

    try {
      const endpoint = action === 'add' ? 'add' : 'remove';
      const response = await fetch(`/swym/api/wishlist/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          productId: productId.toString(),
          variantId: variantId.toString(),
          productUrl,
          listId: String(lid),
        }),
      });

      const {success, error: apiError}: any = await response.json();

      if (success) {
        setWishlisted(action === 'add');
        const wishlistCount =
          Number(localStorage.getItem('swym-wishlist-count')) || 0;
        const updatedCount =
          action === 'add' ? wishlistCount + 1 : wishlistCount - 1;
        localStorage.setItem('swym-wishlist-count', String(updatedCount));
        if (action === 'add' && !isAuthenticated) {
          if (updatedCount === 1 || updatedCount % 5 === 0) {
            const isMobile = window.innerWidth <= 768;
            if (
              (buttonSource === 'plp' || buttonSource === 'recos') &&
              !isMobile
            ) {
              setShowLoginPopupOnPlp(true);
            } else {
              setLoginPopupButtonSource(buttonSource);
              setShowLoginPopup(true);
            }
          }
        } else if (action === 'remove' && window.innerWidth <= 768) {
          const imageUrl =
            product?.image_url ||
            product?.selectedVariant?.image?.url ||
            product?.media?.nodes?.[0]?.image?.url;
          setWishlistNotification({
            title: product.title || product.family,
            info: 'Removed from Wishlist',
            image: imageUrl,
          });
          setShowWishlistNotification(true);
        }
        await fetchWishlist();
      } else {
        console.error(apiError || `Failed to ${action} product from wishlist`);
      }
    } catch (err) {
      console.error(
        `An error occurred while ${
          action === 'add' ? 'adding to' : 'removing from'
        } the wishlist`,
        err,
      );
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const handleAddToWishlist = (event: React.MouseEvent) =>
    handleWishlistAction(event, 'add');
  const handleRemoveFromWishlist = (event: React.MouseEvent) =>
    handleWishlistAction(event, 'remove');

  const handleRemoveProductFromWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!productId || !wishlistedVariantId || !productUrl) return;

    setLoading(true);
    setActionType('removing');
    try {
      await fetch(`/swym/api/wishlist/remove`, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
          productId: productId.toString(),
          variantId: wishlistedVariantId.toString(),
          productUrl,
          listId: String(lid),
        }),
      });
      await fetchWishlist();
    } catch (err) {
      // Error removing product from wishlist
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const handleSwitchVariantWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!productId || !variantId || !productUrl || !wishlistedVariantId) return;

    setLoading(true);
    setActionType('adding');
    try {
      const response = await fetch(`/swym/api/wishlist/switch-variant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          productId: productId.toString(),
          oldVariantId: wishlistedVariantId.toString(),
          newVariantId: variantId.toString(),
          productUrl,
          listId: String(lid),
        }),
      });

      const {success, error: apiError}: any = await response.json();

      if (success) {
        await fetchWishlist();
        setWishlisted(true);
      }
    } catch (err) {
      // Error switching wishlist variant
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const iconState =
    actionType === 'adding'
      ? true
      : actionType === 'removing'
      ? false
      : wishlisted;

  const buttonRef = useRef<HTMLButtonElement>(null);

  if (!productId || !variantId) return null;

  const isPlpOrRecos = buttonSource === 'plp' || buttonSource === 'recos';
  const buttonTitle = isPlpOrRecos
    ? wishlisted
      ? `Remove ${product.title} from wishlist`
      : `Add ${product.title} to wishlist`
    : isCurrentVariantWishlisted
    ? `Remove ${product.title} from wishlist`
    : wishlistedVariantId && wishlistedVariantId !== variantId
    ? `Save size to Wishlist`
    : `Add ${product.title} to wishlist`;

  const onClickHandler = isPlpOrRecos
    ? wishlisted
      ? handleRemoveProductFromWishlist
      : handleAddToWishlist
    : isCurrentVariantWishlisted
    ? handleRemoveFromWishlist
    : wishlistedVariantId && wishlistedVariantId !== variantId
    ? handleSwitchVariantWishlist
    : handleAddToWishlist;

  const buttonText = loading
    ? actionType === 'adding'
      ? 'Adding...'
      : 'Removing...'
    : isCurrentVariantWishlisted
    ? 'Remove Item from Wishlist'
    : wishlistedVariantId && wishlistedVariantId !== variantId
    ? 'Save size to Wishlist'
    : 'Add to Wishlist';

  const productName = product?.prod_name || product?.title;
  return (
    <div>
      <div
        className={clsx([
          `swym-hl-wishlist-button bg-transparent swym-hl-wishlist-button-type-${buttonType}
          ${buttonType === 'icon' ? 'absolute' : ''}
          right-[5px] flex justify-center
            ${
              buttonSource === 'plp'
                ? 'bottom-[8px] top-auto md:bottom-auto md:top-[5px]'
                : 'top-[5px]'
            }
          `,
        ])}
        aria-label={
          wishlisted
            ? `Remove ${productName} from wishlist`
            : `Add ${productName} to wishlist`
        }
      >
        <button
          data-cnstrc-btn="add_to_wishlist"
          ref={buttonRef}
          onClick={onClickHandler}
          className={clsx([
            `flex gap-[10px] rounded-full bg-opacity-50 p-[6px] ${
              isPlpOrRecos ? 'bg-white' : ''
            } select-none active:scale-95`,
            buttonType === 'icon-text' &&
              squareButtonStyles({
                mode: 'outline',
                tone: 'default',
              }),
            buttonType === 'icon-text' && `w-full hover:opacity-80`,
          ])}
          disabled={loading}
          aria-busy={loading}
          aria-live="polite"
          title={
            wishlisted
              ? `Remove ${productName} from wishlist`
              : `Add ${productName} to wishlist`
          }
        >
          <WishlistIcon
            height={iconHeight}
            width={iconWidth}
            wishlisted={iconState}
            stokeWidth={1.5}
          />
          {buttonType === 'icon-text' && (
            <span className="text-[12px]">{buttonText}</span>
          )}
        </button>
      </div>
      {!isAuthenticated && isPlpOrRecos && (
        <SignInPopup
          popupSource={buttonSource}
          showLoginPopup={showLoginPopupOnPlp}
          setShowLoginPopup={setShowLoginPopupOnPlp}
        />
      )}
    </div>
  );
};

export default AddToWishlistButton;
