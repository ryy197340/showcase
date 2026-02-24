import {LinksFunction} from '@shopify/remix-oxygen';
import React, {createContext, useContext, useEffect, useState} from 'react';

import WishlistNotification from '~/lib/swym/components/wishlist/WishlistNotification';
import swymstyles from '~/lib/swym/swymstyles.css?url';
import {GlobalContext} from '~/lib/utils';

import SignInPopup from '../components/wishlist/SignInPopup';

interface Wishlist {
  id: string;
  lid: string;
  lname: string;
  listcontents: WishlistItem[];
  userinfo: any;
  cnt: number;
}

interface WishlistItem {
  id: string;
  dt: string;
  empi: number;
  epi: number;
  du: string;
  productData: any;
  cprops: any;
  lid: string;
}

interface SwymContextType {
  lid: string | null;
  setLid: (lid: string) => void;
  wishlist: Wishlist | null;
  setWishlist: (items: Wishlist) => void;
  isWishlisted: (productId: number, variantId: number) => boolean;
  isProductWishlisted: (productId: number) => boolean;
  fetchWishlist: () => void;
  setShowLoginPopup: (value: boolean) => void;
  setLoginPopupButtonSource: (source: string) => void;
  setWishlistNotification: (notification: {
    title: string;
    info: string;
    image: string;
  }) => void;
  setShowWishlistNotification: (value: boolean) => void;
  removeIfWishlistedWhenAddToBag: (
    productId: number,
    variantId: number,
    productUrl: string,
  ) => Promise<void>;
  fetchBackInStockSubscriptions: () => Promise<any>;
  isSubscribedToBackInStock: (productId: number, variantId: number) => boolean;
  backInStockSubscriptions: Array<{empi: number; epi: number}>;
  moveToWishlist: (
    productId: number,
    variantId: number,
    productUrl: string,
  ) => Promise<void>;
  syncuser: (email: string) => Promise<void>;
  syncuserBIS: (email: string) => Promise<void>;
}

export const links: LinksFunction = () => [
  {rel: 'stylesheet', href: swymstyles},
];

const SwymContext = createContext<SwymContextType | undefined>(undefined);

export const SwymProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [lid, setLid] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loginPopupButtonSource, setLoginPopupButtonSource] = useState('pdp');
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const {customer, locale} = useContext(GlobalContext);
  const [showWishlistNotification, setShowWishlistNotification] =
    useState(false);
  const [wishlistNotification, setWishlistNotification] = useState({
    title: '',
    info: '',
    image: '',
  });

  const [backInStockSubscriptions, setBackInStockSubscriptions] = useState<
    Array<{empi: number; epi: number}>
  >([]);

  const handleCloseNotification = () => {
    setShowWishlistNotification(false);
  };

  // Fetch wishlist data on page load
  useEffect(() => {
    fetchWishlist();
    fetchBackInStockSubscriptions();
  }, []);

  useEffect(() => {
    if (wishlist) {
      if (customer && !wishlist.userinfo) {
        syncuser(customer.email);
        syncuserBIS(customer.email);
      }
    }
  }, [customer, wishlist]);

  const syncuser = async (email: string) => {
    const response = await fetch(
      `/swym/api/wishlist/syncuser?email=${encodeURIComponent(email)}`,
    );
    const data: any = await response.json();
    if (data.success) {
      fetchWishlist();
    }
  };

  const syncuserBIS = async (email: string) => {
    const response = await fetch(
      `/swym/api/backinstock/syncuser?email=${encodeURIComponent(email)}`,
    );
    const data: any = await response.json();
    if (data.success) {
      fetchBackInStockSubscriptions();
    }
  };

  const fetchWishlist = async () => {
    const response = await fetch(`${locale.pathPrefix}/swym/api/wishlist/list`);
    const {success, data, error}: any = await response.json();
    if (success) {
      const wishlist = data?.[0];
      if (!wishlist) {
        const createdListResponse = await fetch(`/swym/api/wishlist/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            listname: 'My Wishlist',
          }),
        });
        const {success, data, error}: any = await createdListResponse.json();
        if (success) {
          fetchWishlist();
        }
      } else {
        setWishlist(wishlist || {listcontents: []});
        setLid(wishlist?.lid);
        const existingCount = Number(
          localStorage.getItem('swym-wishlist-count'),
        );
        if (existingCount === null || existingCount !== wishlist.cnt) {
          localStorage.setItem('swym-wishlist-count', String(wishlist.cnt));
        }
      }
    }
  };

  const isWishlisted = (productId: number, variantId: number): boolean => {
    return (
      wishlist?.listcontents?.some(
        (item) => item.empi === productId && item.epi === variantId,
      ) || false
    );
  };

  const isProductWishlisted = (productId: number): boolean => {
    return (
      wishlist?.listcontents?.some((item) => item.empi === productId) || false
    );
  };

  const removeIfWishlistedWhenAddToBag = async (
    productId: number,
    variantId: number,
    productUrl: string,
  ) => {
    if (!wishlist || !productId || !variantId || !productUrl) return;
    const isWishlisted = wishlist.listcontents?.some(
      (item) =>
        item.empi === Number(productId) && item.epi === Number(variantId),
    );
    if (isWishlisted) {
      await fetch('/swym/api/wishlist/remove', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
          productId: productId.toString(),
          variantId: variantId.toString(),
          productUrl,
          listId: String(lid),
        }),
      });
      await fetchWishlist();
    }
  };

  useEffect(() => {
    function handler(e: CustomEvent) {
      const {product} = e.detail || {};
      if (product) {
        const handle = product.merchandise.product.handle;
        const productid = Number(product.productGid.split('Product/')[1]);
        const variantid = Number(
          product.variantGid.split('ProductVariant/')[1],
        );
        const productUrl = `${window.location.origin}/products/${handle}`;
        removeIfWishlistedWhenAddToBag(productid, variantid, productUrl);
      }
    }
    window.addEventListener('itemAddedToCart', handler as EventListener);
    return () =>
      window.removeEventListener('itemAddedToCart', handler as EventListener);
  }, [removeIfWishlistedWhenAddToBag]);

  const fetchBackInStockSubscriptions = async () => {
    try {
      const response = await fetch('/swym/api/backinstock/list');
      const result = (await response.json()) as {
        success: boolean;
        data?: {subscriptions: Array<{empi: number; epi: number}>};
      };

      if (result.success && result.data) {
        setBackInStockSubscriptions(result.data.subscriptions);
      }
    } catch (error) {
      console.error('Error fetching back in stock subscriptions:', error);
    }
  };

  const isSubscribedToBackInStock = (
    productId: number,
    variantId: number,
  ): boolean => {
    return backInStockSubscriptions.some(
      (subscription) =>
        subscription.empi === productId && subscription.epi === variantId,
    );
  };

  const moveToWishlist = async (
    productId: number,
    variantId: number,
    productUrl: string,
  ): Promise<void> => {
    if (!lid || !productId || !variantId || !productUrl) return;

    try {
      // Check if any variant of the same product is already in wishlist
      const existingVariant = wishlist?.listcontents?.find(
        (item) => item.empi === productId,
      );

      // If a variant of the same product exists, remove it first
      if (existingVariant) {
        await fetch('/swym/api/wishlist/remove', {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: new URLSearchParams({
            productId: existingVariant.empi.toString(),
            variantId: existingVariant.epi.toString(),
            productUrl,
            listId: String(lid),
          }),
        });
      }

      // Add the new variant to wishlist
      await fetch('/swym/api/wishlist/add', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
          productId: productId.toString(),
          variantId: variantId.toString(),
          productUrl,
          listId: String(lid),
        }),
      });

      // Refresh wishlist data
      await fetchWishlist();
    } catch (error) {
      console.error('Error moving item to wishlist:', error);
    }
  };

  return (
    <SwymContext.Provider
      value={{
        lid,
        setLid,
        wishlist,
        setWishlist,
        isWishlisted,
        isProductWishlisted,
        fetchWishlist,
        setShowLoginPopup,
        setLoginPopupButtonSource,
        setWishlistNotification,
        setShowWishlistNotification,
        removeIfWishlistedWhenAddToBag,
        fetchBackInStockSubscriptions,
        isSubscribedToBackInStock,
        backInStockSubscriptions,
        moveToWishlist,
        syncuser,
        syncuserBIS,
      }}
    >
      {children}
      <SignInPopup
        popupSource={loginPopupButtonSource}
        showLoginPopup={showLoginPopup}
        setShowLoginPopup={setShowLoginPopup}
      />
      <WishlistNotification
        title={wishlistNotification.title}
        info={wishlistNotification.info}
        image={wishlistNotification.image}
        open={showWishlistNotification}
        onClose={handleCloseNotification}
      />
    </SwymContext.Provider>
  );
};

export const useSwymContext = (): SwymContextType => {
  const context = useContext(SwymContext);
  if (!context) {
    throw new Error('useSwymContext must be used within a WishlistProvider');
  }
  return context;
};
