import {ProductWithNodes} from '~/types/shopify';
import {stripGlobalId} from '~/utils';

type Props = {
  updatedColorProduct: ProductWithNodes | undefined;
};

export default function CioCardReviews({updatedColorProduct}: Props) {
  if (updatedColorProduct) {
    return (
      <div
        className="ratings-container mt-4 hidden min-h-6"
        data-bv-show="inline_rating"
        data-bv-product-id={
          updatedColorProduct.id && stripGlobalId(updatedColorProduct.id)
        }
        data-bv-seo="false"
      ></div>
    );
  }
}
