export default function FreeShippingProgress({
  orderTotal,
}: {
  orderTotal: number;
}) {
  const threshold = 150;
  const progress =
    orderTotal >= threshold
      ? 100
      : Math.min((orderTotal / threshold) * 100, 100);

  return (
    <div
      className="mx-auto mt-5 w-full max-w-xl px-2 py-4"
      style={{backgroundColor: '#f2f2f2'}}
    >
      <div className="flex flex-row gap-4 px-2">
        <div>
          ${Number.isInteger(orderTotal) ? orderTotal : orderTotal.toFixed(2)}
        </div>
        {/* Progress bar container */}
        <div className="mt-[4px] h-2 w-full overflow-hidden rounded-full bg-white">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{width: `${progress}%`}}
          />
        </div>
        <div>$150</div>
      </div>

      {/* Text */}
      <p className="text-gray-700 mt-2 text-center text-sm font-medium">
        {orderTotal >= threshold ? (
          <>Free Shipping 🎉</>
        ) : (
          <>
            Spend $
            {Number.isInteger(threshold - orderTotal)
              ? threshold - orderTotal
              : (threshold - orderTotal).toFixed(2)}{' '}
            more and get <span className="font-bold">FREE Shipping</span>
          </>
        )}
      </p>
    </div>
  );
}
