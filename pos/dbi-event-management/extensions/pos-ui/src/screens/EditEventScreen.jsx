import { useState, useEffect } from "react";
import {
  Text,
  Button,
  Screen,
  ScrollView,
  Stack,
  useApi,
  DatePicker,
} from "@shopify/ui-extensions-react/point-of-sale";

export const EditEventScreen = () => {
  const api = useApi();
  const [params, setParams] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const visibleState = useState(false);

  useEffect(() => {
    if (params?.eventDate && params.eventDate.includes("-")) {
      const [year, month, day] = params.eventDate.split("-").map(Number);
      const parsedDate = new Date(year, month - 1, day);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      setSelectedDate(parsedDate >= today ? parsedDate : today);
    }
  }, [params]);

  const handleEditEvent = async () => {
    try {
      if (!selectedDate) {
        api.toast.show("Please select a date before saving.");
        return;
      }

      setIsLoading(true);

      if (!params?.eventUuid) {
        api.toast.show("No eventUuid found. Skipping event update.");
        return;
      }

      const year = selectedDate.getFullYear();
      const month = `${selectedDate.getMonth() + 1}`.padStart(2, "0");
      const day = `${selectedDate.getDate()}`.padStart(2, "0");
      const eventDateString = `${year}-${month}-${day}`;

      const response = await fetch(`${process.env.REACT_APP_EVENTS_API_URL}/${params.eventUuid}`, {
        method: "PATCH",
        headers: {
          accept: "application/json",
          "x-appid": process.env.REACT_DEV_APP_ID,
          authorizationToken: params?.authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventDate: eventDateString }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update event: ${response.statusText}`);
      }

      api.toast.show(`Event updated to ${year}-${month}-${day}!`);

      setTimeout(() => {
        setSelectedDate(null);
        api.navigation.navigate("IndividualEvent", {
          eventUuid: params.eventUuid,
          authToken: params.authToken,
          forceRefresh: true,
        });
      }, 1500);
    } catch (error) {
      console.error("Error:", error);
      api.toast.show(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen
      name="EditEventScreen"
      title="Edit Event"
      presentation={{ sheet: true }}
      onReceiveParams={setParams}>
      <ScrollView>
        <Stack direction="vertical" gap="800" padding="400" alignItems="center">
          <Text>
            {selectedDate
              ? `Selected date: ${selectedDate.getFullYear()}-${String(
                  selectedDate.getMonth() + 1
                ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
              : "No date selected"}
          </Text>

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

              setSelectedDate(parsedDate);
            }}
            selected={selectedDate ?? new Date()}
            inputMode="inline"
          />

          <Button
            title={isLoading ? "Saving..." : "Save Changes"}
            kind="primary"
            disabled={isLoading || !selectedDate}
            onPress={handleEditEvent}
          />
        </Stack>
      </ScrollView>
    </Screen>
  );
};
