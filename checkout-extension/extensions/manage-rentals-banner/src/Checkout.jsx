import "@shopify/ui-extensions/preact";
import { render } from "preact";
import {
  useCartLines,
  useExtension
} from "@shopify/ui-extensions/checkout/preact";
import { useEffect, useState } from "preact/hooks";

export default async () => {
  render(<Extension />, document.body);
};

const getProductVariantsQuery = `
  query getProducts($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        metafield(namespace: "cm_rental", key: "is_rental") {
          value
        }
      }
    }
  }
`;

function useHasRentalCollateral() {
  const [hasRentalCollateral, setHasRentalCollateral] = useState(false);
  const cartLines = useCartLines();

  useEffect(() => {
    const checkRentalCollateral = async () => {
      const productVariantIds = cartLines
        .filter((lineItem) => lineItem.merchandise?.id ?? false)
        .map((lineItem) => lineItem.merchandise.id);

      if (productVariantIds.length === 0) {
        setHasRentalCollateral(false);
        return;
      }

      try {
        const productVariants = await shopify.query(getProductVariantsQuery, {
          variables: {
            ids: productVariantIds,
          },
          version: "2025-10",
        });

        if (!productVariants.data) {
          throw productVariants.errors;
        }

        setHasRentalCollateral(
          productVariants.data?.nodes.some(
            (node) => node.metafield?.value === "true"
          )
        );
      } catch (e) {
        console.error(e);
        setHasRentalCollateral(false);
      }
    };

    checkRentalCollateral();
  }, [cartLines]);

  return hasRentalCollateral;
}


/*
const getOrderURLQuery = `
  query getOrderURL($ids: ID) {
    node(id: $id) {
      ... on Order {
        statusUrl
      }
    }
  }
`;
function useOrderUrl() {
  const [orderUrl, setOrderUrl] = useState(undefined);

  useEffect(() => {
    const orderId = shopify.orderConfirmation.value.order.id;

    if (orderId) return;

    const getOrderUrl = async () => {
      try {
        const order = await shopify.query(getOrderURLQuery, {
          variables: {
            id: orderId,
          },
          version: "2025-10",
        });

        if (!order.data) {
          throw order.errors;
        }
        console.log("data");
        console.log(order.data);
        setOrderUrl(order.data.node.statusUrl);
      } catch (e) {
        console.error(e);
        setOrderUrl(undefined);
      }
    };

    getOrderUrl();
  }, [shopify.orderConfirmation.value.order]);

  return orderUrl;
}
*/

function Extension() {
  const cartContainsRental = useHasRentalCollateral();
  const isEditor = useExtension().editor?.type ?? false;
  const shouldRender = cartContainsRental || isEditor;
  const manageRentalsUrl = `${shopify.shop.storefrontUrl}/account/orders`

  if (!shouldRender) return <></>;

  return (
    <s-box border="base" padding="base" borderRadius="base">
      <s-stack gap="base">
        <s-heading>Rentals</s-heading>
        <s-text>
          Continue to your account to view and manage your rentals.
        </s-text>
        <s-button variant="primary" href={manageRentalsUrl}>
          Manage Rentals
        </s-button>
      </s-stack>
    </s-box>
  );
}
