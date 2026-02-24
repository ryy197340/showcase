export interface ProductVariantProps {
    id: string;
    name: string;
    color: string;
    size: string;
    extraLength: string;
    image: string;
    price: {
      amount: number;
      currencyCode: string;
    };
    quantityAvailable: number;
    availableForSale: boolean;
    memberPrice?: number;
  }