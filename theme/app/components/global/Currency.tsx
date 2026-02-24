import {Money} from '@shopify/hydrogen';
import {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

type Props = {
  data: MoneyV2;
  className?: string;
};

export default function Currency({data, className}: Props) {
  if (data.currencyCode === 'USD') {
    return <Money data={data} className={className} />;
  } else {
    return <span className={className}>{returnCurrency(data)}</span>;
  }
}

function returnCurrency(data: MoneyV2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currencyCode,
  }).format(Number(data.amount));
}
