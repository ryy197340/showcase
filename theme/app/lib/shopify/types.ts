import {Product, ProductVariant} from '@shopify/hydrogen/storefront-api-types';

export type ProductWithColorSwatches = Product & ColorSwatches;

export type ColorSwatch = {
  products: {
    edges: {
      node: {
        colorSwatches: {
          edges: {
            node: {
              handle: string;
              id: string;
              metafield: any;
              options: {
                name: string;
                values: string[];
              }[];
            };
            tags: string[];
            title: string;
          }[];
        };
      }[];
    };
  };
  back_image?: {
    reference: {
      image: {
        url: string;
      };
    };
  };
  description: string;
  designedToFit: any;
  details: any;
  handle: string;
  id: string;
  isQuickView: boolean;
  media: any;
  options: any;
  selectedVariant: any;
  tags: string[];
  title: string;
  variants: any;
  vendor: string;
};

export type ColorSwatches = {
  colorSwatches: ColorSwatch;
  filteredColorSwatches?: ColorSwatch;
  back_image?: {
    reference: {
      image: {
        url: string;
      };
    };
  };
};

export type ISizeChart = {
  reference: {
    fields: {
      key: string;
      value: string;
      reference: {
        image: {
          id: string;
          url: string;
          altText?: string | null;
          width: number;
          height: number;
        };
      } | null;
    }[];
  };
  value: string;
  type: string;
};

export type ExtendedProduct = Product & {
  selectedVariant?: ProductVariant;
  isQuickView?: boolean;
  bestSeller?: any;
  isCatalog?: boolean;
  colorSwatches?: ColorSwatches;
  sizeChart?: ISizeChart;
  styleNumber?: {
    value: string;
  };
};

export type ShopifyApiProduct = Pick<
  Product,
  | 'description'
  | 'handle'
  | 'id'
  | 'media'
  | 'metafield'
  | 'options'
  | 'tags'
  | 'title'
  | 'variants'
> & {
  isQuickView: boolean;
};

export type SortParam =
  | 'price-low-high'
  | 'price-high-low'
  | 'best-selling'
  | 'newest'
  | 'featured'
  | 'title-a-z'
  | 'title-z-a';
