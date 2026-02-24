import CartGiftExclamation from '../icons/CartGiftExclamation';

type Props = {
  content: string;
};

export default function InfoElement({content}: Props) {
  return (
    <span role="button" title={content}>
      <CartGiftExclamation />
    </span>
  );
}
