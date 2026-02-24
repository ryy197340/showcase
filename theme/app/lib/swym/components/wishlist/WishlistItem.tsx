import {Image} from '@shopify/hydrogen';
import {Product} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import React, {useEffect, useRef, useState} from 'react';

import Currency from '~/components/global/Currency';
import Modal from '~/components/global/ModalCard';
import ProductDetailsCard from '~/components/product/DetailsCardPLP';

import {useSwymContext} from '../../context/SwymContext';

interface WishlistItemProps {
  wishlistItem: WishlistItem;
  editable?: boolean;
  type?: 'carousel-item' | 'grid-item';
  isAccountPage?: boolean;
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

const WishlistItem: React.FC<WishlistItemProps> = ({
  wishlistItem,
  editable,
  type = 'grid-item',
  isAccountPage,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [products, setProducts] = useState<Product[]>([
    wishlistItem.productData,
  ]);
  const {fetchWishlist} = useSwymContext();
  const modalButtonRef = useRef<HTMLButtonElement>(null);
  const removeButtonRef = useRef<HTMLButtonElement>(null);
  let productUrl = wishlistItem.cprops?.ou || wishlistItem.du;

  productUrl =
    location.origin +
    '/products/' +
    productUrl.split('/products/').pop().split('?variant=')[0];

  // Store focused element before modal opens
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle focus management when modal opens/closes
  useEffect(() => {
    if (modalOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      // Restore focus when modal closes
      previousFocusRef.current.focus();
    }
  }, [modalOpen]);

  if (!wishlistItem.productData || !isVisible) {
    return null;
  }
  const firstvariant =
    wishlistItem.productData?.variants?.edges?.[0]?.node?.price || {};
  const {amount, currencyCode} = firstvariant;

  const getResizedImageUrl = (url: string, width: any, height: any) => {
    if (!url) {
      return '';
    }
    const parts = url.split('.');
    const ext = parts.pop();
    return `${parts
      .join('.')
      .replace(/(_\d+x\d+)?$/, '')}_${width}x${height}.${ext}`;
  };

  const imageUrl =
    wishlistItem?.productData?.featuredImage?.url ||
    wishlistItem?.productData?.images?.edges?.[0]?.node?.url;

  const imageUrlWithSize =
    type === 'carousel-item'
      ? getResizedImageUrl(imageUrl, 250, 315)
      : getResizedImageUrl(imageUrl, 664, 885);

  const handleRemoveFromWishlist = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    const wishlistCount = Number(localStorage.getItem('swym-wishlist-count'));
    const wishlistCountNumber = wishlistCount - 1;
    localStorage.setItem('swym-wishlist-count', wishlistCountNumber.toString());
    const productId = wishlistItem.empi;
    const variantId = wishlistItem.epi;
    const lid = wishlistItem.lid;

    if (!productId || !variantId || !productUrl) {
      console.error('Missing required product details');
      return;
    }

    setIsVisible(false);

    try {
      const response = await fetch('/swym/api/wishlist/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          productId: productId.toString(),
          variantId: variantId.toString(),
          productUrl: productUrl || '',
          listId: lid || '',
        }),
      });

      const {
        success,
        error: apiError,
        data: wishlistItem,
      }: any = await response.json();

      if (success) {
        fetchWishlist();
      } else {
        console.error(apiError || 'Failed to remove product from wishlist');
      }
    } catch (err) {
      console.error(
        'An error occurred while removing the product from the wishlist',
      );
    }
  };

  return (
    <li
      key={wishlistItem.id}
      className={`relative flex flex-col gap-4 ${
        type === 'carousel-item'
          ? 'w-[calc(100%/2)] flex-shrink-0 sm:w-[calc(100%/3)] lg:w-[calc(100%/4)]'
          : ''
      }`}
    >
      <div className="group relative flex aspect-[335/448] items-center justify-center overflow-hidden bg-lightGray object-cover">
        <div className="relative h-full w-full lg:inline-block lg:w-full">
          <a
            href={productUrl}
            rel="noopener noreferrer"
            className="swym-h-img-link"
            aria-label={`View ${wishlistItem.productData.title}`}
          >
            <Image
              src={imageUrlWithSize}
              alt={wishlistItem.productData.title || 'Product image'}
              className="mb-2 h-full w-full object-cover"
            />
          </a>
          {editable && (
            <button
              ref={removeButtonRef}
              onClick={handleRemoveFromWishlist}
              className="hover:bg-gray-100 absolute right-0 top-0 mr-2 mt-2 cursor-pointer rounded-full bg-white p-2 shadow transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Remove ${wishlistItem.productData.title} from wishlist`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="9"
                viewBox="0 0 10 9"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1.58009 8.78917L0.75293 7.96201L4.06157 4.65338L0.75293 1.34474L1.58009 0.517578L4.88873 3.82622L8.19736 0.517578L9.02452 1.34474L5.71589 4.65338L9.02452 7.96201L8.19736 8.78917L4.88873 5.48053L1.58009 8.78917Z"
                  fill="#13294E"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="absolute bottom-2 left-2">
          <button
            onClick={() => {
              setModalOpen(true);
            }}
            className="shadow-md flex h-8 w-8 items-center justify-center rounded-full bg-white opacity-60 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={`Select size to add ${wishlistItem.productData.title} to bag`}
            aria-haspopup="dialog"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 8 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M2.76695 7.30506V4.63106H0.0789532V3.07706H2.76695V0.417062H4.36295V3.07706H7.05095V4.63106H4.36295V7.30506H2.76695Z"
                fill="#13294E"
              ></path>
            </svg>
          </button>
        </div>
      </div>
      <a
        href={productUrl}
        rel="noopener noreferrer"
        aria-label={`View ${wishlistItem.productData.title} details, priced at ${currencyCode} ${amount}`}
      >
        <div className="text-center text-[14px]">
          <div>{wishlistItem.productData.title}</div>
          <div className="mt-3 flex min-h-4 justify-center text-[11px]">
            {firstvariant && (
              <div className="text-[11px]">
                <Currency data={firstvariant} />
              </div>
            )}
          </div>
        </div>
      </a>
      {modalOpen && (
        <Modal
          isModalOpen={modalOpen}
          closeModal={() => {
            setModalOpen(false);
          }}
        >
          <ProductDetailsCard
            title={wishlistItem.productData.title}
            currentProductUrl={productUrl}
            data={wishlistItem.productData}
            products={products}
            setProducts={setProducts}
            selectedVariantId={wishlistItem.epi}
          />
        </Modal>
      )}
    </li>
  );
};

export default WishlistItem;
