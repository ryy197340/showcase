import {
  Dialog,
  List,
  useCartSubscription,
  type ListRowSubtitle,
} from "@shopify/ui-extensions-react/point-of-sale";
import { type FC, useState } from "react";

export interface ProductVariantListProps {
  setBanner: (banner: string) => any;
  setSelectedVariant: (banner: string) => any;
  variantsToShow: any;
}

export interface SingleVariantdata {
  id: string;
  title: string;
  image: string;
  price: {
    currencyCode: string;
    amount: string;
  };
  quantity: number;
  orderable: boolean;
  selectedOptions: any[];
}

const ProductVariantList: FC<ProductVariantListProps> = ({
  setBanner,
  setSelectedVariant,
  variantsToShow,
}) => {
  const [dialogBox, setDialogBox] = useState(false);
  const cart = useCartSubscription();
  const properties = cart.properties;
  const isLoyaltyID = Number(properties["Loyalty ID"]);

  const handleEventDateLabel = (
    eventDate: string,
    eventBased: string,
  ) => {
    if (!eventBased) return false;
    if (eventBased.split("T")[0] <= eventDate) {
      return true;
    }
    return false;
  };

  const handleEventDate = (
    eventDate: string,
    eventBased: string,
    quantity: number,
    tracked: boolean,
  ) => {
    if (quantity > 0 || tracked === false) return true;
    if (!eventBased) return false;
    if (eventBased.split("T")[0] <= eventDate) {
      return true;
    }
    return false;
  };
  const productDataList =
    variantsToShow &&
    variantsToShow.map((singleVariant: any) => ({
      id: singleVariant.id.split("/").pop(),
      leftSide: {
        label:
          singleVariant.selectedOptions &&
          singleVariant?.selectedOptions
            .map((options: any) => options.value)
            .join(" ∘ "),
        image: {
          source: singleVariant.image,
        },
        subtitle: [
          {
            content:
              "$" +
              (isLoyaltyID && singleVariant.memberPrice
                ? singleVariant.memberPrice
                : singleVariant.price),
          },
          {
            content: `In store - ${singleVariant?.inventoryItem?.quantity >= 0 ? singleVariant.inventoryItem.quantity : 0 } | Orderable - ${handleEventDateLabel(singleVariant.eventDate, singleVariant.eventBased) ? "True" : "False"}`,
            color: handleEventDate(
              singleVariant.eventDate,
              singleVariant.eventBased,
              singleVariant.inventoryItem.quantity,
              singleVariant.inventoryItem.tracked
            )
              ? "TextSuccess"
              : "TextCritical",
          },
        ] as [ListRowSubtitle, ListRowSubtitle?],
      },
      onPress: () => {
        const leadTimeResult = handleEventDate(
          singleVariant.eventDate,
          singleVariant.eventBased,
          singleVariant.inventoryItem.quantity,
          singleVariant.inventoryItem.tracked
        );
        if (!leadTimeResult) {
          setDialogBox(true);
          return;
        }
        singleVariant.orderable = leadTimeResult;
        setSelectedVariant(singleVariant);
        setBanner(
          "Selected Variant : " +
            singleVariant.selectedOptions
              .map((options: any) => options.value)
              .join(" ∘ "),
        );
      },
    }));
  return (
    <>
      <Dialog
        type="destructive"
        title="Alert"
        content="Item Not Available"
        actionText="OK"
        onAction={() => {
          setDialogBox(false);
        }}
        showSecondaryAction={false}
        isVisible={dialogBox}
      />
      {variantsToShow?.length > 0 && (
        <List
          imageDisplayStrategy="always"
          title="Variants"
          data={productDataList}
        />
      )}
    </>
  );
};

export default ProductVariantList;
