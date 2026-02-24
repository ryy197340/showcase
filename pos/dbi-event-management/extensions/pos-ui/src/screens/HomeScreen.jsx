import React from "react";
import {
  Text,
  Screen,
  ScrollView,
  Button,
  Stack,
  useApi,
} from "@shopify/ui-extensions-react/point-of-sale";

export const HomeScreen = ({ onCreateEvent, authToken, shopifyCustomerId }) => {
  const api = useApi();

  return (
    <Screen name="EventManagement" title="Event Management">
      <ScrollView>
        <Stack direction="vertical" gap="800" padding="400" alignItems="center">
          <Text size="medium">Welcome to David's Bridal Event Management</Text>

          {shopifyCustomerId ? (
            <Text>Customer ID: {shopifyCustomerId}</Text>
          ) : (
            <Text>Please select a customer to continue</Text>
          )}

          <Stack direction="vertical" gap="400" alignItems="center">
            <Button
              title={`Create Event${!shopifyCustomerId ? " (Select a Customer)" : ""}`}
              kind="primary"
              onPress={onCreateEvent}
              isDisabled={!shopifyCustomerId}
              fullWidth
            />

            <Button
              title={`View My Events${!shopifyCustomerId ? " (Select a Customer)" : ""}`}
              kind="primary"
              onPress={() => api.navigation.navigate("ViewEvents", { authToken })}
              isDisabled={!shopifyCustomerId}
              fullWidth
            />

            <Button
              title="Search Customer"
              kind="primary"
              onPress={() => api.navigation.navigate("SearchCustomerScreen", { authToken })}
              fullWidth
            />
          </Stack>
        </Stack>
      </ScrollView>
    </Screen>
  );
};
