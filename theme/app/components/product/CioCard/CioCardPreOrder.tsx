type Props = {
  preorderMessage: string | undefined;
};

export default function CioCardPreOrder({preorderMessage}: Props) {
  if (preorderMessage) {
    return (
      <div className="mb-[8px] flex justify-center gap-[5px] text-[11px] font-bold uppercase text-preorderMessage">
        {preorderMessage}
      </div>
    );
  }
  return null;
}
