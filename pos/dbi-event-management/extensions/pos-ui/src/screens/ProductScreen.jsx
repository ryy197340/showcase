import { useState, useEffect, useMemo } from "react";
import {
  Screen,
  useApi,
  List,
  Text,
  ScrollView,
  Stack,
  Button,
  RadioButtonList,
  useCartSubscription,  
} from "@shopify/ui-extensions-react/point-of-sale";

export const ProductScreen = () => {
  const api = useApi();
  const [params, setParams] = useState(null);
  const [productData, setProductData] = useState(null);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [selectedVariantLabel, setSelectedVariantLabel] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isSelectingVariant, setIsSelectingVariant] = useState(false);
  const cart = useCartSubscription();
  const [cartItemsCount, setCartItemsCount] = useState(0);  

  useEffect(() => {
    if (cart?.lineItems) {
      const totalQuantity = cart.lineItems.reduce((acc, item) => acc + item.quantity, 0);
      setCartItemsCount(totalQuantity);
    }
  }, [cart?.lineItems]);

  const toggleDescription = () => setExpandedDescription((prev) => !prev);

  useEffect(() => {
    if (!params?.sku && !params?.product) return;

    const fetchProducts = async () => {
      // TODO: Replace params.product with params.sku for real-life scenarios and clean up the code
      try {
        const resultProducts = await api.productSearch.searchProducts({
          queryString: params.product,
        });

        if (resultProducts?.items?.length) {
          const productWithVariant = resultProducts.items
            .map((item) => ({
              product: item,
              variant: item.variants.find(
                (variant) => variant.sku === (params.sku ?? params.product)
              ),
            }))
            .find(({ variant }) => variant);

          const resultProduct = await api.productSearch.fetchProductWithId(
            Number(productWithVariant.product.id)
          );
          const allVariants = resultProduct.variants;

          setProductData(
            productWithVariant
              ? {
                  ...productWithVariant.product,
                  selectedVariant: productWithVariant.variant,
                  allVariants,
                }
              : null
          );
        } else {
          setProductData(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProductData(null);
      }
    };

    fetchProducts();
  }, [params?.sku, params?.product, api.productSearch]);

  const variantItems = useMemo(() => {
    return productData?.allVariants?.map((variant) => `${variant.sku} | ${variant.title}`) ?? [];
  }, [productData?.allVariants]);

  useEffect(() => {
    if (!selectedVariantLabel && variantItems.length > 0) {
      setSelectedVariantLabel(variantItems[0]);
    }
  }, [variantItems, selectedVariantLabel]);

  const handleVariantSelectConfirm = () => {
    const selectedSku = selectedVariantLabel.split(" | ")[0];
    const selectedVariant = productData?.allVariants.find((variant) => variant.sku === selectedSku);

    if (selectedVariant) {
      setIsSelectingVariant(true);
      try {
        setProductData((prev) => ({
          ...prev,
          selectedVariant,
        }));
        api.toast.show(`Selected variant: ${selectedVariant.title}`);
        setShowVariantSelector(false);
      } catch (error) {
        api.toast.show(`Error selecting variant: ${error.message || "Unknown error"}`);
      } finally {
        setIsSelectingVariant(false);
      }
    } else {
      api.toast.show("Variant not found.");
    }
  };

  const selectedVariant = productData?.selectedVariant;

  const listData = selectedVariant
    ? [
        {
          id: "id",
          leftSide: {
            label: productData.title,
            image: { source: selectedVariant.image ?? productData?.featuredImage },
          },
        },
        {
          id: "variant",
          leftSide: { label: "Variant", subtitle: [{ content: selectedVariant.title ?? "N/A" }] },
        },
        {
          id: "sku",
          leftSide: { label: "SKU", subtitle: [{ content: selectedVariant.sku ?? "N/A" }] },
        },
        {
          id: "createdAt",
          leftSide: {
            label: "Created At",
            subtitle: [{ content: selectedVariant.createdAt ?? "N/A" }],
          },
        },
        {
          id: "updatedAt",
          leftSide: {
            label: "Updated At",
            subtitle: [{ content: selectedVariant.updatedAt ?? "N/A" }],
          },
        },
      ]
    : [];

  const inventoryData = selectedVariant
    ? [
        {
          id: "inventoryIsTracked",
          leftSide: { label: "Inventory Tracked" },
          rightSide: { label: selectedVariant.inventoryIsTracked ? "Yes" : "No" },
        },
        {
          id: "inventoryAtLocation",
          leftSide: { label: "Inventory at Location" },
          rightSide: { label: selectedVariant.inventoryAtLocation ?? "N/A" },
        },
        {
          id: "totalInventory",
          leftSide: { label: "Total Inventory" },
          rightSide: { label: selectedVariant.inventoryAtAllLocations ?? "N/A" },
        },
      ]
    : [];

  const moreDetailsData = selectedVariant
    ? [
        {
          id: "price",
          leftSide: { label: "Price" },
          rightSide: { label: selectedVariant.price ?? "N/A" },
        },
        {
          id: "vendor",
          leftSide: { label: "Vendor" },
          rightSide: { label: productData.vendor ?? "N/A" },
        },
        {
          id: "productType",
          leftSide: { label: "Product Type" },
          rightSide: { label: productData.productType ?? "N/A" },
        },
        {
          id: "description",
          leftSide: { label: "Description" },
          rightSide: {
            label: expandedDescription ? "Hide Description" : "View Description",
            showChevron: true,
          },
          onPress: toggleDescription,
        },
      ]
    : [];

  return (
    <Screen
      name="ProductScreen"
      title="Product Details"
      presentation={{ sheet: true }}
      onReceiveParams={(incomingParams) => {
        setParams(incomingParams);
        setProductData(null);
        setSelectedVariantLabel("");
        setShowVariantSelector(false);
        setExpandedDescription(false);
      }}>
      <ScrollView>
        <Stack direction="vertical" gap="800" padding="400" alignItems="center">
          {!showVariantSelector && (
            <>
              {selectedVariant && <List data={listData} />}
              {selectedVariant && <List title="Inventory" data={inventoryData} />}
              {selectedVariant && <List title="More Details" data={moreDetailsData} />}
              {expandedDescription && productData?.description && (
                <Text>{productData.description}</Text>
              )}

              <Stack direction="vertical" gap="800" padding="400" alignItems="center">
                {productData?.allVariants?.length > 1 && (
                  <Button title="Select Variant" onPress={() => setShowVariantSelector(true)} />
                )}

                {/* Show Add to Cart button only when we have a valid product and variant */}
                {selectedVariant?.id ? (
                  <Button
                    title={
                      isAddingToCart 
                        ? "Adding..." 
                        : selectedVariant?.sku ? `Add to cart (${selectedVariant.sku})` : "Add to cart"
                    }
                    loading={isAddingToCart}
                    disabled={isAddingToCart}
                    onPress={async () => {
                      setIsAddingToCart(true);
                      try {
                        api.toast.show("Adding item to cart...");

                        const lineItemUuid = await api.cart.addLineItem(selectedVariant.id, 1);

                        await api.cart.addLineItemProperties(lineItemUuid, {
                          "Order Type": "OH",
                        });

                        await api.cart.addCartProperties({
                          "Event UUID": params?.eventUuid,
                        });

                        api.toast.show(`Item added: ${lineItemUuid}`);
                      } catch (error) {
                        api.toast.show(`Error: ${error?.message || error}`);
                        console.error("Add to cart error:", error);
                      } finally {
                        setIsAddingToCart(false);
                      }
                    }}
                  />
                ) : (                  
                    <Text>This product could not be found in Shopify. It may have been removed or is unavailable in this store.</Text>                  
                )}
              </Stack>
            </>
          )}

          {showVariantSelector && (
            <>
              <RadioButtonList
                items={variantItems}
                onItemSelected={setSelectedVariantLabel}
                initialSelectedItem={selectedVariantLabel || variantItems[0]}
              />
              <Text>Selected: {selectedVariantLabel || "None"}</Text>

              <Stack direction="vertical" gap="400" alignItems="center">
                <Button 
                  title={isSelectingVariant ? "Selecting..." : "Confirm Variant"}
                  onPress={handleVariantSelectConfirm}
                  loading={isSelectingVariant}
                  disabled={isSelectingVariant || !selectedVariantLabel} 
                />
                <Button title="Cancel" onPress={() => setShowVariantSelector(false)} />
              </Stack>
            </>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
};
