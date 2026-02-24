import { useState, useEffect, useCallback } from "react";
import {
  Text,
  Screen,
  ScrollView,
  Button,
  Stack,
  List,
  useApi,
} from "@shopify/ui-extensions-react/point-of-sale";

export const ViewEventsScreen = ({ shopifyCustomerId }) => {
  const api = useApi();
  const [params, setParams] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventData, setEventData] = useState({ rawEvents: null, events: [] });
  const [error, setError] = useState(null);
  const [shopifyCustomerData, setShopifyCustomerData] = useState(null);

  const handleEventPress = useCallback(
    (event) => {
      api.navigation.navigate("IndividualEvent", {
        eventUuid: event._source.eventUuid,
        eventData: event,
        authToken: params?.authToken,
      });
    },
    [api.navigation, params?.authToken]
  );

  const fetchEvents = useCallback(async () => {
    try {
      if (!shopifyCustomerId) {
        throw new Error("Missing Shopify customer ID");
      }

      setIsLoading(true);
      setError(null);

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
      setShopifyCustomerData(customerData);

      const customerUuid = customerData?.data?.customerUuid?.value;
      if (!customerUuid) {
        throw new Error("Customer UUID not found in response");
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Event search request timed out")), 2000)
      );

      const fetchPromise = fetch(`${process.env.REACT_APP_SEARCH_API_URL}/event`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-appid": process.env.REACT_DEV_APP_ID,
          authorizationToken: params?.authToken,
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
              ],
            },
          },
          sort: [{ eventDate: { order: "asc" } }],
        }),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.hits?.hits?.length) {
        const formattedEvents = data.hits.hits.map((hit) => {
          const source = hit._source;
          const eventOwner = source.eventPartyMembers?.find((member) => member.isOwner) || {};

          return {
            id: source.eventUuid,
            leftSide: {
              label: source.eventType || "Unknown Event",
              subtitle: [
                {
                  content:
                    `${eventOwner.firstName || "Unknown"} ${eventOwner.lastName || ""}`.trim(),
                },
                {
                  content: source.eventDate || "No Date Available",
                },
              ],
            },
            rightSide: {
              label: "View Details",
              showChevron: true,
            },
            onPress: () => handleEventPress(hit),
          };
        });

        setEventData({ rawEvents: data, events: formattedEvents });
        api.toast.show(
          `${formattedEvents.length} event${formattedEvents.length !== 1 ? "s" : ""} found`
        );
      } else {
        setEventData({ rawEvents: null, events: [] });
        api.toast.show("No events found");
      }
    } catch (err) {
      console.error("Error fetching events:", err);

      if (err.message.includes("timed out")) {
        setEventData({ rawEvents: null, events: [] });
        api.toast.show("No upcoming events found for this customer.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [api.toast, handleEventPress, params?.authToken, shopifyCustomerId]);

  const handleParams = (incoming) => {
    setParams(incoming);
    if (incoming?.forceRefresh) {
      fetchEvents();
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (params?.forceRefresh) {
      fetchEvents();
    }
  }, [params?.forceRefresh, fetchEvents]);

  return (
    <Screen
      name="ViewEvents"
      title={`${
        shopifyCustomerData?.data?.firstName
          ? `${shopifyCustomerData.data.firstName.charAt(0).toUpperCase()}${shopifyCustomerData.data.firstName.slice(1)}'s Upcoming Events`
          : "My Upcoming Events"
      }`}
      onBack={() => api.navigation.pop()}
      presentation={{ sheet: true }}
      onReceiveParams={handleParams}>
      <ScrollView>
        <Stack direction="vertical" gap="400" padding="400">
          {isLoading ? (
            <Text>Loading events...</Text>
          ) : error ? (
            <Stack direction="vertical" gap="400">
              <Text>{error}</Text>
              <Button title="Retry" onPress={fetchEvents} kind="primary" />
            </Stack>
          ) : eventData.events.length === 0 ? (
            <Text>No events found</Text>
          ) : (
            <List title="Events" data={eventData.events} />
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
};
