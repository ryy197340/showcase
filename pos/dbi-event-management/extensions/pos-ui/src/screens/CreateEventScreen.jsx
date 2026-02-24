import { useState, useEffect } from "react";
import {
  Text,
  Screen,
  ScrollView,
  Button,
  Stack,
  DatePicker,
  SegmentedControl,
  useApi,
} from "@shopify/ui-extensions-react/point-of-sale";

const eventTypes = [
  { id: "Wedding", label: "Wedding" },
  { id: "Prom", label: "Prom" },
  { id: "FirstCommunion", label: "First Communion" },
  { id: "Homecoming", label: "Homecoming" },
  { id: "Graduation", label: "Graduation" },
  { id: "Group", label: "Group" },
  { id: "Quinceanera", label: "Quinceanera" },
  { id: "SpecialOccasion", label: "Special Occasion" },
  { id: "MilitaryBall", label: "Military Ball" },
  { id: "PartyOnly", label: "Party Only" },
];

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCmsEventId = async (authToken, api) => {
  const apiUrl = `${process.env.UTITLITY_API_URL}/sequence/ShopifyEventId`;
  
  try {
    let storeId = "0350"; 
    
    if (api && api.session && api.session.currentSession) {
      const { shopId } = api.session.currentSession;
      if (shopId) {
        storeId = String(shopId).slice(-4).padStart(4, "0");
      }
    }
    
    const sequenceResponse = await fetch(
      apiUrl, {
        method: "GET",
        headers: {
          "authorizationToken": authToken,
          "x-appid": "postman",
        },
      }
    );
    
    if (!sequenceResponse.ok) {
      throw new Error(`Failed to get sequence: ${sequenceResponse.status}`);
    }
    
    const sequenceData = await sequenceResponse.json();
    const paddedCounter = String(sequenceData.next).padStart(16, "0");
    const eventId = `${storeId}${paddedCounter}`;
    
    return eventId;
  } catch (error) {
    console.error("Error generating cmsEventId:", error);
    throw error;
  }
};

export const CreateEventScreen = ({ authToken, shopifyCustomerId }) => {
  const api = useApi();
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState(new Date());
  const visibleState = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState({ authToken, shopifyCustomerId });
  const [customerUuid, setCustomerUuid] = useState(null);
  const [error, setError] = useState(null);
  const [cmsEventId, setCmsEventId] = useState("");

  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      authToken,
      shopifyCustomerId,
    }));
  }, [authToken, shopifyCustomerId]);

  useEffect(() => {
    const fetchCustomerUuid = async () => {
      if (!shopifyCustomerId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
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

        if (!response.ok) {
          throw new Error(`Failed to fetch customer: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data?.customerUuid?.value) {
          const extractedUuid = data.data.customerUuid.value;
          setCustomerUuid(extractedUuid);
          api.toast.show("Customer found");
        } else {
          throw new Error("Customer UUID not found in response");
        }
      } catch (err) {
        console.error("Error fetching customer:", err);
        setError(`Failed to fetch customer: ${err.message}`);
        api.toast.show(`Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (shopifyCustomerId) {
      fetchCustomerUuid();
    }
  }, [shopifyCustomerId, api.toast, params?.authToken, api]);

  const createEvent = async () => {
    try {
      const cmsEventId = await getCmsEventId(params?.authToken, api);
      setCmsEventId(cmsEventId);
      
      const createEventResponse = await fetch(process.env.REACT_APP_EVENTS_API_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-appid": process.env.REACT_DEV_APP_ID,
          authorizationToken: params?.authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType: eventType,
          eventDate: formatDate(eventDate),
          cmsEventId: cmsEventId,
        }),
      });

      if (!createEventResponse.ok) {
        throw new Error(`Event creation failed: ${createEventResponse.status}`);
      }

      const eventData = await createEventResponse.json();
      if (!eventData.eventUuid) {
        throw new Error("Event creation succeeded but no eventUuid was returned");
      }

      return eventData;
    } catch (error) {
      console.error("Event creation error:", error);
      api.toast.show(`Error: ${error.message}`);
      throw error;
    }
  };

  const addMemberToEvent = async (eventUuid) => {
    try {
      const addMemberResponse = await fetch(
        `${process.env.REACT_APP_EVENTS_API_URL}/${eventUuid}/member`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "x-appid": process.env.REACT_DEV_APP_ID,
            authorizationToken: params?.authToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              customerUuid: customerUuid,
              role: "Bride",
              isOwner: true,
            },
          ]),
        }
      );

      if (!addMemberResponse.ok) {
        throw new Error(`Failed to add member: ${addMemberResponse.status}`);
      }

      return await addMemberResponse.json();
    } catch (error) {
      console.error("Add member error:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!eventType) {
      api.toast.show("Please select an event type");
      return;
    }

    if (!eventDate) {
      api.toast.show("Please select an event date");
      return;
    }

    if (!params?.authToken) {
      api.toast.show("Cannot connect to the event system. Please try again.");
      return;
    }

    if (!customerUuid) {
      api.toast.show("Customer information not available. Please select a different customer.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      api.toast.show("Creating event...");
      const eventData = await createEvent();
      api.toast.show("Adding customer to event...");
      await addMemberToEvent(eventData.eventUuid);

      api.toast.show(`Event created successfully!`);
      api.navigation.pop();
    } catch (err) {
      console.error("Process failed:", err);
      setError(`Failed: ${err.message}`);
      api.toast.show(`Unable to create event. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen
      name="CreateEvent"
      title="Create Event"
      onBack={() => api.navigation.pop()}
      onReceiveParams={setParams}>
      <ScrollView>
        <Stack direction="vertical" gap="400" padding="400">
          {cmsEventId && (
            <Stack direction="vertical" background="bg-surface-secondary" padding="400" borderRadius="300">
              <Text fontWeight="bold">cmsEventId:</Text>
              <Text appearance="success">{cmsEventId}</Text>
            </Stack>
          )}
          
          {!shopifyCustomerId && (
            <Text appearance="critical">Please select a customer before creating an event</Text>
          )}

          {error && <Text appearance="critical">{error}</Text>}

          <Text>Event Type</Text>
          <SegmentedControl segments={eventTypes} selected={eventType} onSelect={setEventType} />

          <Text>Selected date: {formatDate(eventDate)}</Text>

          <Button title="Show Date Picker" onPress={() => visibleState[1](true)} />

          <DatePicker
            visibleState={visibleState}
            onChange={(selected) => {
              const parsedDate = new Date(selected);
              parsedDate.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              if (parsedDate < today) {
                api.toast.show("Please select a future date.");
                return;
              }

              setEventDate(parsedDate);
            }}
            selected={eventDate ?? new Date()}
            inputMode="inline"
          />

          <Button
            title={isLoading ? "Creating..." : "Create Event"}
            kind="primary"
            onPress={handleSubmit}
            loading={isLoading}
            isDisabled={!shopifyCustomerId || !customerUuid || isLoading}
            fullWidth
          />
        </Stack>
      </ScrollView>
    </Screen>
  );
};
