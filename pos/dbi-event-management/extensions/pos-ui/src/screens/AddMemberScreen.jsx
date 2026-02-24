import React, { useState } from "react";
import {
  Text,
  Screen,
  ScrollView,
  Stack,
  useApi,
  List,
  TextField,
  Button,
} from "@shopify/ui-extensions-react/point-of-sale";

export const AddMemberScreen = () => {
  const api = useApi();
  const [params, setParams] = useState(null);
  const [searchQuery, setSearchQuery] = useState({ phone: "", email: "" });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentView, setCurrentView] = useState("search");
  const [errors, setErrors] = useState({ phone: "", email: "" });
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleCustomerClick = (customerId) => {
    console.log(`Clicked customer: ${customerId}`);
    setSelectedCustomer((prev) => (prev === customerId ? null : customerId));
  };

  const validateFields = () => {
    const newErrors = { phone: "", email: "" };
    const isValid = searchQuery.phone.trim() !== "" || searchQuery.email.trim() !== "";

    if (!isValid) {
      newErrors.phone = "Enter a phone number or email to search";
      newErrors.email = "Enter a phone number or email to search";
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (field, value) => {
    setSearchQuery((prev) => ({ ...prev, [field]: value }));
    if (value.trim() !== "") {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSearchCustomers = async () => {
    if (!validateFields()) return;

    setIsSearching(true);

    // TODO: Find a way to handle cases where no search results are returned without relying on a timeout-based alternative

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("No customers found.")), 2000)
      );

      const fetchPromise = fetch(`${process.env.CUSTOMER_HUB_BASE_URL}/v1/information/search`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-appid": process.env.REACT_DEV_APP_ID,
          authorizationToken: params?.authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchQuery),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      if (response.status === 204) {
        throw new Error("No customers found.");
      }

      const data = await response.json();

      if (!data || (Array.isArray(data) && data.length === 0)) {
        api.toast.show("No customers found. Redirecting to create a new customer...");
        api.navigation.navigate("CreateCustomerScreen", {
          eventUuid: params?.eventUuid,
          authToken: params?.authToken,
          searchQuery,
        });
        return;
      }

      setSearchResults(data);
      setCurrentView("results");
    } catch (error) {
      console.error("Search error:", error);
      api.toast.show(error.message || "Unknown error");

      if (error.message.includes("No customers found") || error.message.includes("timed out")) {
        api.navigation.navigate("CreateCustomerScreen", {
          eventUuid: params?.eventUuid,
          authToken: params?.authToken,
          searchQuery,
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (customerUuid) => {
    if (!params?.eventUuid || !customerUuid || !params?.authToken) {
      api.toast.show("Invalid parameters. Please try again.");
      return;
    }

    setIsAdding(true);
    api.toast.show(`Adding member...${params?.eventUuid} ${customerUuid}`);

    try {
      const response = await fetch(`${process.env.REACT_APP_EVENTS_API_URL}/${params?.eventUuid}/member`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-appid": process.env.REACT_DEV_APP_ID,
          authorizationToken: params?.authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ customerUuid, role: "Other", isOwner: false }]),
      });

      if (!response.ok) {
        throw new Error(`Failed to add member: ${response.statusText}`);
      }

      api.toast.show("Member added successfully!");
      api.navigation.navigate("ManageMembersScreen", {
        eventUuid: params.eventUuid,
        authToken: params.authToken,
      });
    } catch (error) {
      console.error("Add member error:", error);
      api.toast.show(`Error adding member: ${error.message || "Unknown error"}`);
    } finally {
      setIsAdding(false);
    }
  };

  const listData =
    searchResults.map((customer) => ({
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
      name="AddMemberScreen"
      title="Add Member"
      presentation={{ sheet: true }}
      onBack={() =>
        currentView === "results"
          ? setCurrentView("search")
          : api.navigation.navigate("ManageMembersScreen", {
              eventUuid: params?.eventUuid,
              authToken: params?.authToken,
            })
      }
      onReceiveParams={setParams}>
      <ScrollView>
        <Stack direction="vertical" gap="400" padding="400">
          {currentView === "search" ? (
            <>
              <Text size="large" emphasis="bold">
                Search for a Customer
              </Text>
              <TextField
                label="Phone"
                value={searchQuery.phone}
                onChange={(value) => handleInputChange("phone", value)}
                placeholder="Enter phone number"
                error={errors.phone}
              />
              <TextField
                label="Email"
                value={searchQuery.email}
                onChange={(value) => handleInputChange("email", value)}
                placeholder="Enter email address"
                error={errors.email}
              />
              <Button
                title={isSearching ? "Searching..." : "Search Customers"}
                kind="primary"
                onPress={handleSearchCustomers}
                fullWidth
                loading={isSearching}
                disabled={isSearching || (!searchQuery.phone.trim() && !searchQuery.email.trim())}
              />
            </>
          ) : (
            <>
              <Text size="large" emphasis="bold">
                Search Results
              </Text>
              <List title="Matching Customers" data={listData} />

              {selectedCustomer && (
                <ScrollView>
                  {searchResults
                    .filter((customer) => customer.customerUuid === selectedCustomer)
                    .map((customer) => (
                      <Stack
                        key={customer.customerUuid}
                        direction="vertical"
                        gap="400"
                        alignItems="center">
                        <Text>{`CustomerUuid: ${customer.customerUuid || "N/A"}`}</Text>
                        <Text>{`Email: ${customer.email || "N/A"}`}</Text>
                        <Text>{`Phone: ${customer.phone || "N/A"}`}</Text>
                        <Button
                          title={isAdding ? "Adding..." : `Add Customer ${customer.firstName}`}
                          onPress={() => handleAddMember(customer.customerUuid)}
                          loading={isAdding}
                          disabled={isAdding}
                        />
                      </Stack>
                    ))}
                </ScrollView>
              )}

              <Button
                title="Back to Search"
                kind="secondary"
                onPress={() => setCurrentView("search")}
                fullWidth
              />
            </>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
};
