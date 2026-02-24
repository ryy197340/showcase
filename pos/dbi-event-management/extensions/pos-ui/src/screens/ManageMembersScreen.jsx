import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Text,
  Screen,
  ScrollView,
  Stack,
  useApi,
  List,
  Button,
} from "@shopify/ui-extensions-react/point-of-sale";

export const ManageMembersScreen = () => {
  const api = useApi();
  const [params, setParams] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [customerDetails, setCustomerDetails] = useState({});
  const [selectedPartyMember, setSelectedPartyMember] = useState(null);
  const [selectedCustomerUuid, setSelectedCustomerUuid] = useState(null);
  const [selectedMembersToRemove, setSelectedMembersToRemove] = useState([]);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [isFetchingCustomers, setIsFetchingCustomers] = useState(false);
  const [isFetchingSingleCustomer, setIsFetchingSingleCustomer] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (params?.eventUuid) {
      setEventData(null);
      setCustomerDetails({});
      setSelectedPartyMember(null);
      setSelectedCustomerUuid(null);
      setSelectedMembersToRemove([]);
    }
  }, [params?.eventUuid]);

  const fetchEventDetails = useCallback(async () => {
    if (!params?.eventUuid || !params?.authToken) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_EVENTS_API_URL}/${params.eventUuid}`, {
        headers: {
          accept: "application/json",
          "x-appid": process.env.REACT_DEV_APP_ID,
          authorizationToken: params?.authToken,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch event details");

      const data = await response.json();
      setEventData(data);
      api.toast.show("Event details refreshed");
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  }, [params, api.toast]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  useEffect(() => {
    if (!eventData?.eventPartyMembers) return;

    const fetchCustomers = async () => {
      setIsFetchingCustomers(true);
      setCustomerDetails({});

      const customerData = {};

      try {
        await Promise.all(
          eventData.eventPartyMembers.map(async (member) => {
            if (!member.customerUuid) return;
            try {
              const response = await fetch(
                `${process.env.CUSTOMER_HUB_BASE_URL}/v1/information/${member.customerUuid}`,
                {
                  headers: {
                    accept: "application/json",
                    "x-appid": process.env.REACT_DEV_APP_ID,
                    authorizationToken: params?.authToken,
                  },
                }
              );

              if (!response.ok) throw new Error(`Failed to fetch customer: ${member.customerUuid}`);

              const data = await response.json();
              customerData[member.customerUuid] = data;
            } catch (error) {
              console.error(`Error fetching customer ${member.customerUuid}:`, error);
            }
          })
        );

        setCustomerDetails(customerData);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setIsFetchingCustomers(false);
      }
    };

    fetchCustomers();
  }, [eventData, params]);

  useEffect(() => {
    if (!selectedCustomerUuid || customerDetails[selectedCustomerUuid]) return;

    const fetchCustomerDetails = async () => {
      setIsFetchingSingleCustomer(true);
      try {
        const response = await fetch(
          `${process.env.CUSTOMER_HUB_BASE_URL}/v1/information/${selectedCustomerUuid}`,
          {
            headers: {
              accept: "application/json",
              "x-appid": process.env.REACT_DEV_APP_ID,
              authorizationToken: params?.authToken,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch customer details");

        const data = await response.json();
        setCustomerDetails((prev) => ({ ...prev, [selectedCustomerUuid]: data }));
      } catch (error) {
        console.error(`Error fetching customer ${selectedCustomerUuid}:`, error);
      } finally {
        setIsFetchingSingleCustomer(false);
      }
    };

    fetchCustomerDetails();
  }, [selectedCustomerUuid, params?.authToken, customerDetails]);

  const handlePartyMemberClick = useCallback(
    (partyMemberId, customerUuid) => {
      if (isRemoveMode) {
        setSelectedMembersToRemove((prev) =>
          prev.includes(partyMemberId)
            ? prev.filter((id) => id !== partyMemberId)
            : [...prev, partyMemberId]
        );
        return;
      }
      setSelectedPartyMember((prev) => (prev === partyMemberId ? null : partyMemberId));
      setSelectedCustomerUuid((prev) => (prev === customerUuid ? null : customerUuid));
    },
    [isRemoveMode]
  );

  const memberListData = useMemo(() => {
    if (!eventData?.eventPartyMembers) return [];

    return eventData.eventPartyMembers.map((member) => {
      const customer = customerDetails[member.customerUuid];

      let displayName = "Loading...";
      if (!isFetchingCustomers) {
        displayName = customer?.firstName
          ? `${customer.firstName} ${customer.lastName || ""}`.trim()
          : "Unknown";
      }

      return {
        id: member.partyMemberUuid,
        leftSide: {
          label: displayName,
          description: isFetchingCustomers
            ? "Fetching customer details..."
            : customer?.email || member.role || "Other",
        },
        rightSide: {
          label: selectedPartyMember === member.partyMemberUuid ? "Hide Details" : "View Details",
          showChevron: true,
        },
        onPress: () => handlePartyMemberClick(member.partyMemberUuid, member.customerUuid),
      };
    });
  }, [
    eventData,
    customerDetails,
    selectedPartyMember,
    isFetchingCustomers,
    handlePartyMemberClick,
  ]);

  const handleRemoveSelected = async (selectedMembersToRemove) => {
    if (!selectedMembersToRemove.length) {
      api.toast.show("No members selected for removal.");
      return;
    }

    setIsRemoving(true);
    api.toast.show(`Removing ${selectedMembersToRemove.length} selected members...`);

    try {
      const removeRequests = selectedMembersToRemove.map(async (partyMemberId) => {
        const response = await fetch(
          `${process.env.REACT_APP_EVENTS_API_URL}/${params?.eventUuid}/member/${partyMemberId}`,
          {
            method: "DELETE",
            headers: {
              accept: "application/json",
              "x-appid": process.env.REACT_DEV_APP_ID,
              authorizationToken: params?.authToken,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to remove member ${partyMemberId}: ${response.statusText}`);
        }

        console.log(`Member ${partyMemberId} removed successfully`);
      });

      await Promise.all(removeRequests);

      api.toast.show(`Successfully removed ${selectedMembersToRemove.length} members.`);

      fetchEventDetails();

      setIsRemoveMode(false);
      setSelectedMembersToRemove([]);
      setSelectedPartyMember(null);
      setSelectedCustomerUuid(null);
    } catch (error) {
      console.error("Error removing party members:", error);
      api.toast.show(`Error: ${error.message}`);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Screen
      name="ManageMembersScreen"
      title="Manage Members"
      presentation={{ sheet: true }}
      onReceiveParams={setParams}>
      <ScrollView>
        <Stack direction="vertical" gap="600" padding="400" alignItems="center">
          <Text>Event Members</Text>

          {!isRemoveMode ? (
            <>
              <Button
                title="Add Member"
                kind="primary"
                onPress={() =>
                  api.navigation.navigate("AddMemberScreen", {
                    eventUuid: params?.eventUuid,
                    authToken: params?.authToken,
                  })
                }
                fullWidth
              />
              <Button
                title="Remove Members"
                kind="critical"
                onPress={() => setIsRemoveMode(true)}
                fullWidth
              />
            </>
          ) : (
            <Stack direction="vertical" gap="400" alignItems="center" width="100%">
              <Text>Select members to remove</Text>
              <Text>{selectedMembersToRemove.length} member(s) selected</Text>
              <Stack direction="horizontal" gap="400" distribution="fill" width="100%">
                <Button
                  title={isRemoving 
                    ? "Removing..." 
                    : `Remove Selected (${selectedMembersToRemove.length})`
                  }
                  kind="critical"
                  onPress={() => handleRemoveSelected(selectedMembersToRemove)}
                  disabled={!selectedMembersToRemove.length || isRemoving}
                  loading={isRemoving}
                />
                <Button
                  title="Cancel"
                  kind="secondary"
                  onPress={() => setIsRemoveMode(false)}
                  fullWidth
                />
              </Stack>
            </Stack>
          )}

          <List title="Event Party Members" data={memberListData} />

          {selectedPartyMember && (
            <Stack direction="vertical" gap="400" alignItems="center">
              <Text>Selected Member Details</Text>
              {isFetchingSingleCustomer ? (
                <Text>Loading customer details...</Text>
              ) : customerDetails[selectedCustomerUuid] ? (
                <Stack direction="vertical" gap="400" alignItems="center">
                  <Text>First name: {customerDetails[selectedCustomerUuid]?.firstName}</Text>
                  <Text>Last name: {customerDetails[selectedCustomerUuid]?.lastName}</Text>
                  <Text>Email: {customerDetails[selectedCustomerUuid]?.email}</Text>
                  <Text>Phone: {customerDetails[selectedCustomerUuid]?.phone}</Text>
                  {/* <Text>Customer Uuid: {customerDetails[selectedCustomerUuid]?.customerUuid}</Text> */}
                </Stack>
              ) : (
                <Text>No details available</Text>
              )}
            </Stack>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
};
