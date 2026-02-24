import React from "react";

import {
  Text,
  Screen,
  ScrollView,
  Stack,
  useApi,
} from "@shopify/ui-extensions-react/point-of-sale";
import { Button } from "@shopify/ui-extensions/point-of-sale";

export const CustomerSearchNoResultsScreen = () => {
  const api = useApi();

  return (
    <Screen
      name="CustomerSearchNoResultsScreen"
      title="Customer Search No Results"
      presentation={{ sheet: true }}>
      <ScrollView>
        <Stack direction="vertical" gap="800" padding="400" alignItems="center">
          <Text>{`No matching customers`}</Text>
          <Button
            title="Add Customer"
            onPress={() => api.navigation.navigate("CreateCustomerScreen")}
          />
        </Stack>
      </ScrollView>
    </Screen>
  );
};
