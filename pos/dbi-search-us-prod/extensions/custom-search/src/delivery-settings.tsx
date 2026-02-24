import { useState, useEffect, useRef } from "react";
import {
  RadioButtonList,
  Screen,
  ScrollView,
  Text,
  Button,
  Banner,
  useApi,
  Stack,
  useCartSubscription,
} from "@shopify/ui-extensions-react/point-of-sale";
import { v4 as uuidv4 } from "uuid";
import { addDays, calculateDaysDiff, formatDateToTH, subtractDays } from "./helper";

export const queryToShopifyStore = async (query: string) => {
  const response = await fetch(
    process.env.REACT_APP_STOREFRONT_API as string,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": process.env
          .REACT_APP_X_SHOPIFY_STOREFRONT_ACCESS_TOKEN as string,
      },
      body: JSON.stringify({ query }),
    },
  );
  return response;
};

const retriveTabNamesQuery = `{metaobjects(type: "pos_ship_to_home_toggle",first:1) {
  nodes {
    fields {
      key
      value
    }
  }
}}`;

const ChooseSpecialOrderType = () => {
  const api = useApi<"pos.home.modal.render">();
  const cart = useCartSubscription();
  const [selected, setSelected] = useState("");
  const [banner, setBanner] = useState<string>("");
  const [uuid, setUuid] = useState<string>("");
  const [orderTypes, setOrderTypes] = useState<string>("");
  const [params, setParams] = useState<any>();
  const [requiredDate, setRequiredDate] = useState<string>("");
  const [unavailableMessage, setUnavailableMessage] = useState<string>("");
  const [sorDueDate, setSorDueDate] = useState<string>("");
  const leadTimeDateRef = useRef<Date | null>(null);
  const [previousLineItems, setPreviousLineItems] = useState<any[]>(cart.lineItems);
  const [shipToHomeEnabled, setShipToHomeEnabled] = useState<boolean>(false);

  // This constant can be used to add a buffer to the delivery date calculation
  const DELIVERY_BUFFER_DAYS: number = 0; // Adjust this value as needed

  useEffect(() => {
    if (params) {
      const fetchShipToHomeStatus = async () => {
        try {
          const response = await queryToShopifyStore(retriveTabNamesQuery);
          const responseData = await response.json();
          
          // Extract the fields from the response
          const metaobjectNode = responseData?.data?.metaobjects?.nodes?.[0];
          
          if (metaobjectNode) {
            const isEnabledField = metaobjectNode.fields.find(field => field.key === "is_ship_to_home_enabled");
            setShipToHomeEnabled(isEnabledField?.value === "true");
          } else {
            console.error("No metaobject found with type pos_ship_to_home_toggle");
            setShipToHomeEnabled(false);
          }
        } catch (error) {
          console.error("Error fetching ship to home status:", error);
          setShipToHomeEnabled(false);
        }
      };
      fetchShipToHomeStatus();

      const orderType =
        !params.singleVariant?.inventoryItem.quantity &&
        params.singleVariant?.inventoryItem.tracked &&
        params.singleVariant?.orderable
          ? "SO"
          : "OH";
      setOrderTypes(orderType);
      handleEstimatedDate();
    }
  }, [params]);

  const handleEstimatedDate=()=>{
     const rawDate = params.singleVariant?.eventBased;
      const dateObj = new Date(rawDate);
      const yyyymmdd = `${dateObj.getFullYear()}${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${dateObj.getDate().toString().padStart(2, "0")}`;

      if (yyyymmdd.indexOf("NaN") === -1) {
        leadTimeDateRef.current = dateObj;
        try {
          const currentDate = new Date();
          let eventDate = null;
          if (cart?.properties["Event Date"]) {
            eventDate = new Date(cart?.properties["Event Date"]);
          }

          const diffDays = calculateDaysDiff(
            currentDate,
            leadTimeDateRef.current,
          );

          let dueDate = subtractDays(eventDate, diffDays);

          if (calculateDaysDiff(currentDate, new Date(dueDate)) >= 60) {
            dueDate = addDays(currentDate, 60);
          }
          setSorDueDate(new Date(dueDate).toDateString());
          
          let newEstDeliveryDate = addDays(currentDate, (calculateDaysDiff(currentDate, dateObj) + calculateDaysDiff(currentDate, new Date(dueDate)) + DELIVERY_BUFFER_DAYS)).toDateString()
          
          // if the order is not going to be SOR order then show the api lead time date  
          if (cart?.properties["Order Type"] !== "Layaway") { 
            newEstDeliveryDate = dateObj.toDateString();
          }
          setRequiredDate(formatDateToTH(new Date(newEstDeliveryDate)));

          if (new Date(newEstDeliveryDate) < eventDate) {
            setUnavailableMessage(`Estimated delivery date: ${newEstDeliveryDate}`);
          } else {
            setUnavailableMessage(`Product is not available for special order, since the estimated delivery date is: ${new Date(newEstDeliveryDate)?.toDateString()}`);
          }
        } catch (error) {
          console.error("Error adding cart properties:", error);
        }
      } else {
        setUnavailableMessage("Product is not available for special order");
      }
  }

  const handleButtonClick = (isPickup: Boolean,uuid:any) => {
    if (cart?.properties["Order Type"] === "Layaway") {
      const sorProperties = {
        "Order Type": "SOR",
        "SOR Due Date": sorDueDate,
      };
      api.cart.addCartProperties(sorProperties);
    } else {
      api.cart.addCartProperties({ "Order Type": "SO" });
    }

    if (!isPickup) {
      api.cart.addCartProperties({ "Ship to Customer": "Yes" });
    }

    
    const properties: Record<string, string> = {};
    properties["Style Number"] = params.singleVariant?.styleNumber?.value || "";
    if (requiredDate && params.searchType !== "all") {
      properties["Estimated delivery date"] = requiredDate;
    }
    properties["Order Type"] = "SO";
    properties["_soDetailId"] = uuidv4();
    properties["Pickup at Store"] = isPickup ? "Yes" : "No";

    api.cart.addLineItemProperties(uuid, properties);

    api.toast.show("Details saved successfully");
    api.navigation.dismiss();
  };

  const handleShippingType=(uuid:any)=>{
      if (orderTypes === "SO") {
          if (selected === "Ship to Customer Address") {
            handleButtonClick(false,uuid);
          } else if (selected === "Ship to Store") {
            handleButtonClick(true,uuid);
          }
    } else if (orderTypes === "OH") {
          if (selected === "Ship to Customer Address") {
              handleButtonClick(false,uuid);
          } else if (selected === "Take Sale") {
              api.cart.addLineItemProperties(uuid, {
                "Style Number": params.singleVariant?.styleNumber?.value || "",
                "Order Type": "OH",
              });
            api.toast.show("Details saved successfully");
            api.navigation.dismiss();
          } else if (selected === "Ship to Store") {
            handleButtonClick(true,uuid);
          }
    }
  }
  
    useEffect(() => {
        const processCartChanges = async () => {
          const lineItemsAfterAddtoCart = cart.lineItems;
          const newItem = lineItemsAfterAddtoCart.find((item) =>
            !previousLineItems.find((oldItem) => oldItem.uuid === item.uuid),
          );
          
          if (newItem?.variantId) {
            const resultProductVariant = await api.productSearch.fetchProductVariantWithId(newItem.variantId);
            if (resultProductVariant) {
              // setUuid(newItem.uuid);
              handleShippingType(newItem.uuid);
            }
          }
          setPreviousLineItems(lineItemsAfterAddtoCart);
        };
  
        processCartChanges();
    }, [cart]);

  const handleRequest = async() => {
    if (!selected) {
      setBanner("Please Select Delivery Method");
    } else {
      setBanner("");
      await api.cart.addLineItem(Number(params.singleVariant.id.split("/").pop()), 1); 
    }
  };

  return (
    <Screen
      name="Order Delivery Method"
      title="Order Type"
      onNavigateBack={() => {
        setSelected("");
      }}
      onReceiveParams={(params) => {
        if (params) {
          setParams(params);
        }
      }}
    >
      <ScrollView>
        <Stack direction="vertical" spacing={1}>
          {orderTypes === "SO" || orderTypes === "OH" ? (
            <>
              <Text variant="headingLarge">Select Prefered Method:</Text>
              <Banner
                title={banner}
                variant="error"
                visible={banner.length > 0}
                hideAction
              />
              {orderTypes === "SO" && (
                <RadioButtonList
                  items={shipToHomeEnabled ? ["Ship to Customer Address", "Ship to Store"] : ["Ship to Store"]}
                  onItemSelected={setSelected}
                  initialSelectedItem={selected}
                />
              )}
              {orderTypes === "OH" && (
                <RadioButtonList
                  items={shipToHomeEnabled ? ["Take Sale", "Ship to Customer Address", "Ship to Store"] : ["Take Sale", "Ship to Store"]}
                  onItemSelected={setSelected}
                  initialSelectedItem={selected}
                />
              )}
             <Button
                title="Save Details"
                type="primary"
                onPress={handleRequest}
              />
              <Text variant="captionRegular">{unavailableMessage}</Text>
            </>
          ) : (
            <Text variant="headingLarge">
              Invalid action. To add delivery properties, please remove the
              product from cart and re-add
            </Text>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
};

export default ChooseSpecialOrderType;
