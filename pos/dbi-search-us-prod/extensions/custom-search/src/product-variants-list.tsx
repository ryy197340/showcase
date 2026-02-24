import React, { useEffect, useState } from "react";
import {
  Button,
  Stack,
  ScrollView,
  Banner,
  Icon,
  Selectable,
  SegmentedControl,
  Text,
} from "@shopify/ui-extensions-react/point-of-sale";
import ProductVariantList from "./variant-listing-page";

export function ProductVariantComponent({
  api,
  variantsToShow,
  optionVal,
  selectedVariant,
  setSelectedVariant,
  banner,
  setBanner,
  cart,
  //Added eventId property
  eventId,
}: {
  api: any;
  banner: any;
  setBanner: any;
  variantsToShow: any;
  optionVal: any;
  selectedVariant: any;
  setSelectedVariant: any;
  cart: any;
  //added eventId property
  eventId: string;
}) {
  const [selected, setSelected] = useState("");
  const [filteredVariants, setFilteredVariants] = useState(variantsToShow);
  const [allVariants, setAllVariants] = useState(variantsToShow);
  const [filters, setFilters] = useState<any>({});
  const properties = cart.properties;
  const isLoyaltyID = Number(properties["Loyalty ID"]);
  const handleAddToBag = async (product: any) => {
    //Adding eventID to cart properties

    setBanner("Adding Product to cart...");

    if (eventId) {
      await api.cart.addCartProperties({ "Event ID": eventId });
    }
    await api.navigation.navigate("Order Delivery Method",{
      singleVariant:product
    });
  };

  useEffect(() => {
    // Reset filters when the component mounts
    setFilters({});
    setSelected("");
  }, []);

  useEffect(() => {
    setFilters({});
    setSelected("");
    if (variantsToShow) {
      setFilteredVariants(variantsToShow);
      setAllVariants(variantsToShow);
      initialFilterSet(variantsToShow);
    }
  }, [variantsToShow]);

  useEffect(() => {
    if (optionVal) {
      setFilters((prevFilters: any) => {
        const updatedFilters = {
          ...prevFilters,
          [optionVal?.filterName]: String(optionVal?.value),
        };
        filterData(false, updatedFilters);

        return updatedFilters;
      });
    } else if (variantsToShow && !optionVal) {
      // This handles the case when coming back from variants-options screen
      initialFilterSet(variantsToShow);
      filterData(true);
      setFilteredVariants(variantsToShow);
    }
  }, [optionVal, variantsToShow]);
  function initialFilterSet(variantsData: { selectedOptions: any[] }[]) {
    const initialState = variantsData[0].selectedOptions.reduce((acc, item) => {
      acc[item.name] = "";
      return acc;
    }, {});

    setFilters(initialState);
    setFilteredVariants(variantsData);
  }
  function filterData(clearAll: any, updatedFilters?: any) {
    if (clearAll) {
      setFilteredVariants(variantsToShow);
    } else {
      const activeFilters = Object.entries(updatedFilters).filter(([_, value]) => value !== "");
      let filteredProducts;
      // If no active filters, return all variants
      if (activeFilters.length === 0) filteredProducts = variantsToShow;
      else {
        filteredProducts = variantsToShow.filter((variant: { selectedOptions: any[] }) => {
          return activeFilters.every(([key, value]) => {
            return variant.selectedOptions.some(
              (option) => option.name === key && option.value === value
            );
          });
        });
      }

      setFilteredVariants(filteredProducts);
    }
  }

  function onClickHandler(text: any) {
    setSelected(text);
    api.navigation.navigate("variants-options", {
      filterName: text,
      val: filters?.[text],
    });
  }
  const clearFilters = () => {
    initialFilterSet(variantsToShow);
    filterData(true);
  };
  function FilterButton() {
    return (
      <>
        <SegmentedControl
          segments={[
            ...allVariants?.[0].selectedOptions.map((option: any) => ({
              id: option.name,
              label:
                filters?.[option.name] === ""
                  ? `${option.name} ▼ `
                  : `${option.name} : ${filters?.[option.name]} ▼`,
              disabled: false,
            })),
          ]}
          selected={selected}
          onSelect={onClickHandler}
        />
      </>
    );
  }

  return (
    <ScrollView>
      <Stack
        spacing={2}
        paddingVertical="ExtraSmall"
        paddingHorizontal="Small"
        direction="horizontal">
        {filters && Object.values(filters).some((value) => value !== "") && (
          <Selectable onPress={() => clearFilters()}>
            <Icon name="cancel" size="minor" />
          </Selectable>
        )}

        {allVariants && allVariants?.length > 0 && <FilterButton />}
      </Stack>

      {filteredVariants && (
        <>
          {banner.length > 0 && selectedVariant && (
            <Stack direction="vertical" paddingHorizontal="Small" paddingVertical="ExtraSmall">
              <Banner visible variant={"information"} hideAction title={banner} />
            </Stack>
          )}
          {filteredVariants && filteredVariants?.length > 0 ? (
            <ScrollView>
              <ProductVariantList
                setBanner={setBanner}
                setSelectedVariant={setSelectedVariant}
                variantsToShow={filteredVariants}
              />
            </ScrollView>
          ) : (
            <Stack direction="vertical" paddingHorizontal="Small" paddingVertical="ExtraSmall">
              <Banner title="No Variant Found" visible variant="information" hideAction />
            </Stack>
          )}

          {selectedVariant && (
            <Stack direction="vertical" paddingVertical="Small" paddingHorizontal="Small">
              <>
                <Button
                  type="primary"
                  title="Add To Cart"
                  onPress={() => handleAddToBag(selectedVariant)}
                />
              </>
            </Stack>
          )}
        </>
      )}
    </ScrollView>
  );
}