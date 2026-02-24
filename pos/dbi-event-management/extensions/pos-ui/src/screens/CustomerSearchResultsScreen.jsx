import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  Text,
  Screen,
  ScrollView,
  Stack,
  useApi,
  List,
} from "@shopify/ui-extensions-react/point-of-sale";
import { Button } from "@shopify/ui-extensions/point-of-sale";

const MOCK_CUSTOMER_DATA = [
  {
    customerUuid: uuidv4(),
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "123-456-7890",
  },
  {
    customerUuid: uuidv4(),
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "987-654-3210",
  },
  {
    customerUuid: uuidv4(),
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.johnson@example.com",
    phone: "456-789-0123",
  },
  {
    customerUuid: uuidv4(),
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.davis@example.com",
    phone: "321-654-0987",
  },
];

export const CustomerSearchResultsScreen = () => {
  const api = useApi();
  const [params, setParams] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleCustomerClick = (customerId) => {
    console.log(`Clicked customer: ${customerId}`);
    setSelectedCustomer((prev) => (prev === customerId ? null : customerId));
  };

  useEffect(() => {
    const MOCK_DATA = [
      {
        eventUuid: "e12345-abcde-67890",
        eventDate: "2025-06-15",
        eventType: "Wedding",
        eventVenue: "Grand Ballroom, New York",
        cmsEventId: "cms-98765",
        eventAppointments: ["appointment-001", "appointment-002"],
        eventContributors: [
          {
            contributorRole: "Photographer",
            associateReferenceId: "assoc-123",
          },
          {
            contributorRole: "Caterer",
            associateReferenceId: "assoc-456",
          },
        ],
        eventFavorites: [
          {
            favoriteListUuid: "fav-7890",
            favorites: [
              {
                favoriteUuid: "fav-item-001",
              },
              {
                favoriteUuid: "fav-item-002",
              },
            ],
          },
        ],
        eventPartyMembers: [
          {
            partyMemberUuid: "pm-12345",
            customerUuid: "cust-98765",
            role: "Bride",
            isOwner: true,
          },
          {
            partyMemberUuid: "pm-67890",
            customerUuid: "cust-56789",
            role: "Groom",
            isOwner: false,
          },
        ],
      },
    ];

    if (!params?.eventUuid) return;

    const event = MOCK_DATA.find((event) => event.eventUuid === params.eventUuid);
    console.log("Fetched event:", event);

    if (event) {
      const customerLookup = Object.fromEntries(
        MOCK_CUSTOMER_DATA.map((customer) => [customer.customerUuid, customer])
      );

      const enrichedCustomers = event.eventPartyMembers.map((customer) => ({
        ...customer,
        customerDetails: customerLookup[customer.customerUuid] || null,
      }));

      setEventData({
        ...event,
        eventPartyMembers: enrichedCustomers,
      });
    } else {
      setEventData(null);
    }
  }, [params]);

  const listData =
    MOCK_CUSTOMER_DATA.map((customer) => ({
      id: customer.customerUuid,
      leftSide: {
        label: `${customer.firstName || ""} ${customer.lastName || ""}`,
      },
      rightSide: {
        label: selectedCustomer === customer.customerUuid ? "Hide Details" : "View Details",
        showChevron: true,
      },
      onPress: () => handleCustomerClick(customer.customerUuid),
    })) || [];

  return (
    <Screen
      name="CustomerSearchResultsScreen"
      title="Customer Search Results"
      presentation={{ sheet: true }}
      onReceiveParams={setParams}>
      <ScrollView>
        <Stack direction="vertical" gap="800" padding="400" alignItems="center">
          {eventData && <List title="Matching Customers" data={listData} />}
          {selectedCustomer && eventData && (
            <ScrollView>
              {MOCK_CUSTOMER_DATA.filter(
                (customer) => customer.customerUuid === selectedCustomer
              ).map((customer) => {
                return (
                  <Stack
                    key={customer.customerUuid}
                    direction="vertical"
                    gap="400"
                    alignItems="center">
                    <Text>{`CustomerUuid: ${customer.customerUuid || "N/A"}`}</Text>
                    <Text>{`Email: ${customer.email || "N/A"}`}</Text>
                    <Text>{`Phone: ${customer.phone || "N/A"}`}</Text>

                    <Button
                      title={`Add Customer ${customer.firstName}`}
                      onPress={() => api.toast.show(`Add Customer ${customer.firstName} clicked`)}
                    />
                  </Stack>
                );
              })}
            </ScrollView>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
};
