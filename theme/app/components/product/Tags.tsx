type Props = {
  isNewProduct?: boolean;
  isBestSeller?: boolean;
};

export default function Tags({isNewProduct, isBestSeller}: Props) {
  return (
    <>
      {isNewProduct && (
        <div className="inline-block bg-badge p-[8px] text-2xs">New</div>
      )}
      {isBestSeller && (
        <div className="inline-block bg-badge p-[8px] text-2xs">Bestseller</div>
      )}
    </>
  );
}
