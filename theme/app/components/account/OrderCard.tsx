import {flattenConnection} from '@shopify/hydrogen';

import Badge from '~/components/elements/Badge';
import {Link} from '~/components/Link';
import {statusMessage} from '~/lib/utils';
import {OrderWithNodes} from '~/types/shopify';

type Props = {
  order?: OrderWithNodes;
};

export function OrderCard({order}: Props) {
  if (!order?.id) return null;
  const [legacyOrderId, key] = order!.id!.split('/').pop()!.split('?');
  const lineItems = flattenConnection(order?.lineItems);

  return (
    <li className="relative flex flex-col border-b border-lineGray p-4">
      {/* Fulfillment status */}
      <div className="mb-1 inline-flex">
        <Badge
          mode="outline"
          label={statusMessage(order.fulfillmentStatus)}
          small
        />
      </div>

      <ul className="mt-2 flex-1 flex-row space-y-1">
        <li className="font-bold">
          {new Date(order.processedAt).toDateString()}
        </li>
        <li>#{order.orderNumber}</li>
        <li>
          {lineItems.length > 1
            ? `${lineItems[0].title} +${lineItems.length - 1} more`
            : lineItems[0].title}
        </li>
      </ul>

      {/* Footer */}
      <div className="mt-10 flex flex-row text-sm font-medium text-darkGray">
        <Link
          className="linkTextNavigation"
          to={`/account/orders/${legacyOrderId}?${key}`}
        >
          View details
        </Link>
      </div>
    </li>
  );
}
