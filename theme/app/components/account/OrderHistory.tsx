import {MoneyInput} from '@shopify/hydrogen/storefront-api-types';

import {formatDate, ROW_CLASSES, TH_CLASSES} from '~/lib/utils';
import type {OrderWithNodes} from '~/types/shopify';

import Currency from '../global/Currency';
import LocalizedA from '../global/LocalizedA';

type Props = {
  orders?: OrderWithNodes[];
  weSupplyOrderUrls?: any;
  weSupplyOrdersByEmail?: any;
  setIsModalOpen?: boolean;
  setWeSupplyOrderUrl?: (url: string) => void;
  orderHistoryText: string;
};

export default function AccountOrderHistory({
  orders,
  weSupplyOrderUrls,
  weSupplyOrdersByEmail,
  setIsModalOpen,
  setWeSupplyOrderUrl,
  orderHistoryText,
}: Props) {
  return (
    <div>
      <h2 className="text-left text-lg2">Order History</h2>
      <div className="mt-4 text-sm">
        {orders?.length ? (
          <>
            {weSupplyOrdersByEmail?.length ? (
              <OrdersTable
                weSupplyOrderUrls={weSupplyOrderUrls}
                weSupplyOrdersByEmail={weSupplyOrdersByEmail}
                setIsModalOpen={setIsModalOpen}
                setWeSupplyOrderUrl={setWeSupplyOrderUrl}
              />
            ) : (
              <p className="text-left">{orderHistoryText}</p>
            )}
          </>
        ) : (
          <p className="text-left">You haven&apos;t placed any orders yet.</p>
        )}
      </div>
    </div>
  );
}

function OrdersTable({
  weSupplyOrderUrls,
  weSupplyOrdersByEmail,
  setIsModalOpen,
  setWeSupplyOrderUrl,
}: {
  weSupplyOrderUrls?: any;
  weSupplyOrdersByEmail?: any;
  setIsModalOpen?: boolean;
  setWeSupplyOrderUrl?: (url: string) => void;
}) {
  return (
    <table className="w-full border-collapse text-start text-xs">
      <thead>
        <tr>
          <th className={TH_CLASSES.replace('pl-2', 'pl-0')}>Order</th>
          <th className={TH_CLASSES}>Date</th>
          <th className={TH_CLASSES}>Payment Status</th>
          <th className={TH_CLASSES}>Total</th>
        </tr>
      </thead>
      <tbody>
        {weSupplyOrdersByEmail.map((order) => (
          <OrderRow
            order={order}
            key={order.OrderExternalOrderID}
            weSupplyOrderUrls={weSupplyOrderUrls}
            setWeSupplyOrderUrl={setWeSupplyOrderUrl}
            setIsModalOpen={setIsModalOpen}
          />
        ))}
      </tbody>
    </table>
  );
}

function OrderRow({
  order,
  weSupplyOrderUrls,
  setIsModalOpen,
  setWeSupplyOrderUrl,
}: {
  order: OrderWithNodes;
  weSupplyOrderUrls?: any;
  setIsModalOpen?: boolean;
  setWeSupplyOrderUrl?: (url: string) => void;
}) {
  const total: MoneyInput = {
    amount: order.OrderAmountTotal,
    currencyCode: order.CurrencyCode ?? 'USD',
  };
  if (!order?.OrderExternalOrderID) return null;
  const formattedDate = formatDate(order.OrderDate);

  const orderNumber = order.OrderExternalOrderID;
  const shortOrderNumber = orderNumber.replace('ONLINE', '');
  let activeWeSupplyOrderUrl = weSupplyOrderUrls[shortOrderNumber];
  return (
    <tr>
      <td className={ROW_CLASSES.replace('pl-2', 'pl-0')}>
        <LocalizedA
          className="font-semibold"
          href={activeWeSupplyOrderUrl ? activeWeSupplyOrderUrl : ''}
          onClick={(e) => {
            if (activeWeSupplyOrderUrl) {
              e.preventDefault();
              setIsModalOpen(true);
              activeWeSupplyOrderUrl =
                activeWeSupplyOrderUrl +
                '&platformType=embedded&hideHeader=true&hideFooter=true';
              setWeSupplyOrderUrl(activeWeSupplyOrderUrl);
            }
          }}
        >
          {order.OrderExternalOrderID}
        </LocalizedA>
      </td>
      <td className={ROW_CLASSES}>{formattedDate}</td>
      <td className={ROW_CLASSES}>
        {order.OrderStatus ? order.OrderStatus : 'N/A'}
      </td>
      <td className={ROW_CLASSES}>
        <Currency data={total} />
      </td>
    </tr>
  );
}
