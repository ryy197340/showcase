import {useEffect, useRef, useState} from 'react';

import {ProductWithNodes} from '~/types/shopify';
import {stripGlobalId} from '~/utils';

type Props = {
  publishDate: string;
  updatedColorProduct: ProductWithNodes | undefined;
  topRatedBadgeText?: string | undefined;
};

// Badging within the image should first show 'Top Rated' shopify value if present, next fallback to new, last fallback to Top Rated copy if BazaarVoice reviews are >= 4.5
export default function CioCardImageBadging({
  publishDate,
  updatedColorProduct,
  topRatedBadgeText,
}: Props) {
  const [firstTag, setFirstTag] = useState<string | null>(null);
  const ratingRef = useRef<HTMLDivElement>(null);

  const publishDateConverted = new Date(publishDate);
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const isOlderThan30Days = publishDateConverted < thirtyDaysAgo;

  // Set topRatedBadgeText if available
  useEffect(() => {
    if (topRatedBadgeText) {
      setFirstTag(topRatedBadgeText);
    } else if (!isOlderThan30Days) {
      setFirstTag('New');
    }
  }, [topRatedBadgeText, isOlderThan30Days]);

  useEffect(() => {
    // Don't proceed if tag is already set (topRatedBadgeText takes precedence)
    if (firstTag) return;

    const observer = new MutationObserver(() => {
      if (!ratingRef.current) return;

      const ratingEl = ratingRef.current.querySelector('[class*="bv_text"]');
      if (ratingEl) {
        const ratingValue = parseFloat(ratingEl.textContent || '0');

        if (ratingValue >= 4.5) {
          setFirstTag('Top Rated');
        }
        observer.disconnect();
      }
    });

    if (ratingRef.current) {
      observer.observe(ratingRef.current, {childList: true, subtree: true});
    }

    return () => observer.disconnect();
  }, [updatedColorProduct, firstTag]);

  if (!updatedColorProduct) return null;

  const productId =
    updatedColorProduct.id && stripGlobalId(updatedColorProduct.id);

  return (
    <>
      {firstTag && (
        <div className="absolute left-[10px] top-0 mb-[8px] mt-2 flex justify-center gap-[5px] bg-[#FFFFFF80] p-2 text-[10px] text-black">
          {firstTag}
        </div>
      )}
      <div
        ref={ratingRef}
        className="ratings-container mt-4 hidden min-h-6"
        data-bv-show="inline_rating"
        data-bv-product-id={productId}
        data-bv-seo="false"
      ></div>
    </>
  );
}
