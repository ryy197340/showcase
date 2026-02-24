import clsx from 'clsx';

import PlusIcon from '~/components/icons/Plus';
import QuickviewPlus from '~/components/icons/QuickviewPlus';
type Props = {
  boundOpenModal: () => void;
  product: any;
  variant: any;
  customer: any;
  currency: string;
  index: number;
  resultsOnClick: () => void;
};

export default function CioQuickView({
  boundOpenModal,
  product,
  variant,
  currency,
  customer,
  index,
  resultsOnClick,
}: Props) {
  const handleQuickViewClick = (event: {stopPropagation: () => void}) => {
    event.stopPropagation();
    localStorage.setItem('addToCartContext', 'Quick View');
    boundOpenModal();
    resultsOnClick();
  };

  return (
    <div>
      <button
        onClick={handleQuickViewClick}
        className="pb-[5px] pl-[3px]"
        aria-label="Quick view"
      >
        <QuickviewPlus />
      </button>
    </div>
  );
}
