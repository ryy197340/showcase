import React, { useEffect, useState } from "react";

import {
  Tile,
  reactExtension,
  useApi,
  useCartSubscription,
} from "@shopify/ui-extensions-react/point-of-sale";
import { queryToMiddleWare } from "./helper";

const TileComponent = () => {
  const api = useApi();
  const cart = useCartSubscription();
  const saveStoreId = async () => {
    const { currentSession } = api.session;
    const storedata = await queryToMiddleWare(
      String(currentSession.locationId),
      process.env.REACT_APP_LOCALE as string,
    );
    const storeId = await storedata.json();
    if (
      storeId &&
      storeId.data &&
      storeId.data.metafield &&
      storeId.data.metafield.value
    ) {
      api.cart.addCartProperties({ "Store ID": storeId.data.metafield.value });
    }
  };
  useEffect(() => {
    saveStoreId();
  }, []);
  return (
    <Tile
      title="Custom Search"
      subtitle="Enhanced Custom Search"
      onPress={() => {
        if (!cart.properties["Store ID"]) {
          saveStoreId();
        }
        api.action.presentModal();
      }}
      enabled
    />
  );
};

export default reactExtension("pos.home.tile.render", () => {
  return <TileComponent />;
});
