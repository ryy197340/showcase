import { useState, useEffect } from "react";
import {
  Text,
  Screen,
  ScrollView,
  Stack,
  useApi,
  List,
  Button,
} from "@shopify/ui-extensions-react/point-of-sale";

export const FavoritesScreen = () => {
  const api = useApi();
  const [params, setParams] = useState(null);
  const [selectedFavorite, setSelectedFavorite] = useState(null);
  const [favoriteData, setFavoriteDate] = useState(null);
  const [productImages, setProductImages] = useState({});

  const handleFavoriteClick = (product) => {
    if (selectedFavorite === product) {
      setSelectedFavorite(null);
    } else {
      setSelectedFavorite(product);
    }
  };

  useEffect(() => {
    if (!params?.authToken || !params?.eventData) return;

    const mappedData = {
      eventUuid: params?.eventData?.eventUuid,
      eventDate: params?.eventData?.eventDate,
      eventType: params?.eventData?.eventType,
      eventVenue: params?.eventData?.eventVenue,
      cmsEventId: params?.eventData?.cmsEventId,
      eventPartyMembers: params?.eventData?.eventPartyMembers?.map((member) => ({
        customerUuid: member.customerUuid,
      })),
      eventFavorites: params?.eventData?.eventFavorites.map((favList) => ({
        favoriteListUuid: favList.favoriteListUuid,
        favorites: favList.favorites.map((fav) => ({
          favoritesUuid: fav.favoritesUuid,
        })),
      })),
    };

    console.log(mappedData);

    const customerUuids = mappedData?.eventPartyMembers?.map((member) => member.customerUuid) || [];

    if (customerUuids.length === 0) return;

    const fetchFavorites = async () => {
      try {
        await Promise.all(
          customerUuids.map(async (customerUuid) => {
            try {
              const response = await fetch(
                `${process.env.CUSTOMER_HUB_BASE_URL}/v1/favorites/${customerUuid}`,
                {
                  headers: {
                    accept: "application/json",
                    "x-appid": process.env.REACT_DEV_APP_ID,
                    authorizationToken: params?.authToken,
                  },
                }
              );

              const data = await response.json();
              console.log(`Fetched favorites for customer ${customerUuid}:`, data);

              setFavoriteDate(data?.favorites);

              if (data?.favorites?.length > 0) {
                for (const fav of data.favorites) {
                  if (!fav?.product) continue;
                  
                  try {
                    const productResults = await api.productSearch.searchProducts({
                      queryString: fav.product,
                    });

                    if (productResults?.items?.length > 0) {
                      const product = productResults.items[0];
                      const variant =
                        product.variants.find((v) => v.sku === fav.sku) || product.variants[0];

                      setProductImages((prev) => ({
                        ...prev,
                        [fav.product]: variant?.image || product?.featuredImage,
                      }));
                    }
                  } catch (err) {
                    console.error(`Error fetching image for ${fav.product}:`, err);
                  }
                }
              }
            } catch (error) {
              console.error("Error fetching favorites:", error);
              api.toast.show(`Unable to load favorites. Please try again later.`);
            }
          })
        );
      } catch (error) {
        console.error("Error fetching favorites:", error);
        api.toast.show(`Unable to load favorites. Please try again later.`);
      }
    };

    fetchFavorites();
  }, [params, api.toast, api.productSearch]);

  const listData =
    favoriteData
      ?.map((favorite) => ({
        id: favorite.product || `unknown-${Math.random().toString(36).substring(7)}`,
        leftSide: {
          label: `${favorite.product || 'Unknown Product'}`,
          subtitle: [{ content: `Source: ${favorite.source || 'Unknown'}` }],
          image: productImages[favorite.product]
            ? { source: productImages[favorite.product] }
            : undefined,
        },
        rightSide: {
          label: selectedFavorite === favorite.product ? "Hide Details" : "View Details",
          showChevron: true,
        },
        onPress: () => handleFavoriteClick(favorite.product),
      })) || [];

  return (
    <Screen
      name="FavoritesScreen"
      title="Event Favorites"
      presentation={{ sheet: true }}
      onReceiveParams={setParams}>
      <ScrollView>
        <Stack direction="vertical" gap="800" padding="400" alignItems="center">
          {favoriteData?.length > 0 ? (
            <Text>View Event Favorites</Text>
          ) : (
            <Text>No Event Favorites</Text>
          )}

          {favoriteData && <List title="Favorites" data={listData} />}

          {selectedFavorite &&
            favoriteData &&
            favoriteData
              .filter((favorite) => favorite.product === selectedFavorite)
              .map((favorite) => (
                <Stack
                  key={favorite.product}
                  direction="vertical"
                  gap="400"
                  padding="400"
                  alignItems="center">
                  <Text>{`Product: ${favorite.product || 'Unknown'}`}</Text>
                  <Text>{`Source: ${favorite.source || 'Unknown'}`}</Text>
                  <Text>{`SKU: ${favorite.sku || 'N/A'}`}</Text>
                  <Text>{`Date Added: ${favorite.dateAdded || 'Unknown'}`}</Text>
                  <Button
                    title={`View ${favorite.product || 'Product'} Details`}
                    onPress={() =>
                      api.navigation.navigate("ProductScreen", {
                        sku: favorite?.sku,
                        product: favorite?.product,
                        eventUuid: params?.eventUuid,
                      })
                    }
                  />
                </Stack>
              ))[0]}
        </Stack>
      </ScrollView>
    </Screen>
  );
};
