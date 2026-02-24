import React, { useState, useEffect } from "react";

import {
  Navigator,
  Screen,
  useApi,
  reactExtension,
  useCartSubscription,
} from "@shopify/ui-extensions-react/point-of-sale";
import { ProductSearch } from "./product-search-custom";
import { ProductVariantComponent } from "./product-variants-list";
import { sortOptions } from "./helper";
import { SortComponent } from "./sort-component";
import { VariantOptionList } from "./variant-options-list";
import { ProductVariantProps } from "./types";
import ChooseSpecialOrderType from "./delivery-settings";

const SmartGridModal = () => {
  const api = useApi<"pos.home.modal.render">();
  const [variantsToShow, setVariantsToShow] = useState<any[] | null>(null);
  const [sort, setSort] = useState(sortOptions[0]);
  const [data, setData] = useState<any>();
  const [banner, setBanner] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState();
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantProps | null>(null);
  const cart = useCartSubscription();
  //Added EventId state variable
  const [eventId, setEventId] = useState<string>("");

  const properties = cart.properties;
  const isLoyaltyID = Number(properties["Loyalty ID"]);
  const [previousLineItems, setPreviousLineItems] = useState<any[]>(cart.lineItems);


  return (
    <Navigator>
      <Screen name="product-search" title="product-search">
        <ProductSearch
          api={api}
          setVariantsToShow={setVariantsToShow}
          sort={sort}
          setSort={setSort}
          //Added eventId property
          eventId={eventId}
          setEventId={setEventId}
          setSelectedVariant={setSelectedVariant}
        />
      </Screen>
      <Screen
        name="product-variants"
        title="product-variants"
        onReceiveParams={setSelectedOption}
        onNavigateBack={() => {
          setBanner("");
        }}
      >
        <ProductVariantComponent
          api={api}
          variantsToShow={variantsToShow}
          optionVal={selectedOption}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
          banner={banner}
          setBanner={setBanner}
          eventId={eventId}
          cart={cart}
        />
      </Screen>
      <Screen
        name="variants-options"
        title="product-variants"
        onReceiveParams={setData}
        onNavigateBack={() => {
          // Reset data state when navigating back
          setData(null);
        }}
      >
        <VariantOptionList
          api={api}
          variantsToShow={variantsToShow}
          filter={data?.filterName}
          filterVal={data?.val}
        />
      </Screen>
      <Screen name="sort-options" title="sort-options">
        <SortComponent api={api} sort={sort} setSort={setSort} />
      </Screen>
      <ChooseSpecialOrderType />
    </Navigator>
  );
};

export default reactExtension("pos.home.modal.render", () => {
  return <SmartGridModal />;
});
