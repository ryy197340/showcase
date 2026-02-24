import { useState, useEffect, useCallback } from "react";
import {
  Text,
  Screen,
  ScrollView,
  Button,
  Stack,
  useApi,
} from "@shopify/ui-extensions-react/point-of-sale";

export const IndividualEventScreen = ({ shopifyCustomerId }) => {
  const api = useApi();
  const [params, setParams] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isEventDateLoading, setIsEventDateLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState(false);

  const fetchEventData = useCallback(
    async (eventUuid, authToken) => {
      setIsEventDateLoading(true);
      try {
        if (!shopifyCustomerId) {
          throw new Error("Missing Shopify customer ID");
        }

        const customerResponse = await fetch(
          `${process.env.REACT_APP_MIDDLEWARE_URL}/us/customers/getCustomerFromShopify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: `gid://shopify/Customer/${shopifyCustomerId}`,
              locale: process.env.REACT_APP_DEFAULT_LOCALE || "US",
            }),
          }
        );

        if (!customerResponse.ok) {
          throw new Error(`Failed to fetch customer: ${customerResponse.status}`);
        }

        const customerData = await customerResponse.json();

        const customerUuid = customerData?.data?.customerUuid?.value;
        if (!customerUuid) {
          throw new Error("Customer UUID not found in response");
        }

        const response = await fetch(`${process.env.REACT_APP_SEARCH_API_URL}/event`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "x-appid": process.env.REACT_DEV_APP_ID,
            authorizationToken: authToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: 0,
            size: 100,
            query: {
              bool: {
                must: [
                  {
                    nested: {
                      path: "eventPartyMembers",
                      query: {
                        bool: {
                          must: [
                            {
                              term: {
                                "eventPartyMembers.customerUuid": customerUuid,
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                  {
                    range: {
                      eventDate: {
                        gte: "now/d",
                      },
                    },
                  },
                  {
                    term: {
                      eventUuid: eventUuid,
                    },
                  },
                ],
              },
            },
            sort: [{ eventDate: { order: "asc" } }],
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch event");

        const data = await response.json();
        const hit = data?.hits?.hits?.[0]?._source;

        if (!hit) throw new Error("Event not found in search results");

        setEventData({ ...hit });
        
        fetchFavoritesCount(hit.eventPartyMembers, authToken);

        api.toast.show("Event data loaded successfully.");
      } catch (error) {
        console.error("Failed to reload event data", error);
        api.toast.show("Could not refresh event.");
      } finally {
        setIsEventDateLoading(false);
      }
    },
    [api.toast, shopifyCustomerId]
  );
  
  const fetchFavoritesCount = async (eventPartyMembers, authToken) => {
    setIsFavoriteLoading(true);
    setFavoriteError(false);
    
    try {
      if (!eventPartyMembers || !eventPartyMembers.length) {
        setFavoriteCount(0);
        setIsFavoriteLoading(false);
        return;
      }
      
      let totalFavorites = 0;
      
      await Promise.all(
        eventPartyMembers.map(async (member) => {
          if (!member.customerUuid) return;
          
          try {
            const response = await fetch(
              `${process.env.CUSTOMER_HUB_BASE_URL}/v1/favorites/${member.customerUuid}`,
              {
                headers: {
                  accept: "application/json",
                  "x-appid": process.env.REACT_DEV_APP_ID,
                  authorizationToken: authToken,
                },
              }
            );
            
            if (!response.ok) return;
            
            const data = await response.json();
            if (data?.favorites?.length) {
              totalFavorites += data.favorites.length;
            }
          } catch (error) {
            console.error("Error fetching favorites count", error);
          }
        })
      );
      
      setFavoriteCount(totalFavorites);
      console.log(`Found ${totalFavorites} favorites for this event`);
    } catch (error) {
      console.error("Failed to fetch favorites count", error);
      setFavoriteError(true);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const onNavigateBack = () => {
    api.navigation.navigate("ViewEvents", {
      authToken: params.authToken,
      forceRefresh: true,
    });
  };

  useEffect(() => {
    if (!params) return;

    const shouldFetch = params.forceRefresh || (!params?.eventData?._source && params?.eventUuid);

    if (shouldFetch) {
      api.toast.show("Fetching event data...");
      fetchEventData(params.eventUuid, params.authToken);
    } else {
      setEventData(params.eventData?._source ?? null);
      
      if (params.eventData?._source?.eventPartyMembers) {
        fetchFavoritesCount(params.eventData._source.eventPartyMembers, params.authToken);
      }
      
      api.toast.show("Event data already loaded.");
    }
  }, [params, api.toast, fetchEventData]);

  return (
    <Screen
      name="IndividualEvent"
      title="Event Details"
      presentation={{ sheet: true }}
      onNavigateBack={onNavigateBack}
      onReceiveParams={setParams}>
      <ScrollView>
        <Stack direction="vertical" gap="600" padding="400" alignItems="center">
          <Text variant="headingLarge">{`Event Type: ${eventData?.eventType || "Unknown Event"}`}</Text>
          <Text>{`Event cmsEventId: ${eventData?.cmsEventId || "N/A"}`}</Text>
          <Text>{`Event Date: ${eventData?.eventDate ? eventData.eventDate : "N/A"}`}</Text>
          {eventData?.eventPartyMembers && (
            <Text>
              {`Event Owner: ${
                eventData.eventPartyMembers.find((m) => m.isOwner)?.firstName || ""
              } ${eventData.eventPartyMembers.find((m) => m.isOwner)?.lastName || ""}`}
            </Text>
          )}

          <Stack direction="vertical" gap="200" padding="200" alignItems="start">
            <Text>
              {`Event Favorites: ${
                isFavoriteLoading 
                  ? "Loading..." 
                  : favoriteError 
                    ? "Error loading" 
                    : favoriteCount
              }`}
            </Text>
          </Stack>

          <Stack direction="vertical" gap="400" alignItems="center">
            <Button
              title="Edit Event"
              onPress={() =>
                api.navigation.navigate("EditEventScreen", {
                  eventUuid: eventData?.eventUuid,
                  authToken: params?.authToken,
                  eventDate: eventData?.eventDate ? eventData.eventDate : "N/A",
                })
              }
            />
            <Button
              title="Manage Members"
              onPress={() =>
                api.navigation.navigate("ManageMembersScreen", {
                  eventUuid: eventData?.eventUuid,
                  authToken: params?.authToken,
                })
              }
            />
            <Button
              title="View Favorites"
              disabled={!eventData}
              onPress={() =>
                api.navigation.navigate("FavoritesScreen", {
                  eventUuid: eventData?.eventUuid,
                  authToken: params?.authToken,
                  eventData: eventData,
                })
              }
            />
            <Button
              title="View Transactions"
              onPress={() =>
                api.navigation.navigate("TransactionHub", {
                  eventUuid: eventData?.eventUuid,
                })
              }
            />
            <Button
              title={isEventDateLoading ? "Loading event data..." : "Apply Event to Order"}
              isLoading={isEventDateLoading}
              onPress={() => {
                api.toast.show(`Event has been applied to current order`);
                api.cart.addCartProperties({ 
                  "Event UUID": eventData?.eventUuid,
                  "cmsEventId": eventData?.cmsEventId,
                  "Event Date": eventData?.eventDate,
                });
              }}
            />
            <Button
              title="Remove Event from Order"
              onPress={() => {
                api.toast.show(`Event has been removed from current order`);
                api.cart.removeCartProperties(["Event UUID", "cmsEventId"]);
              }}
            />
          </Stack>
        </Stack>
      </ScrollView>
    </Screen>
  );
};
