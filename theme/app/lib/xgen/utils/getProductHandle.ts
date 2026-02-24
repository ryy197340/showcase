import {RecommendProduct} from '@xgenai/sdk-core';

export default function getProductHandle(product: RecommendProduct): string {
  return product.link.split('/products/').pop() || '';
}
