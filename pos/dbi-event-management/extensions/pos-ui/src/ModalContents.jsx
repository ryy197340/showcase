import { useState, useEffect } from "react";
import { Navigator, useApi } from "@shopify/ui-extensions-react/point-of-sale";
import { CreateEventScreen } from "./screens/CreateEventScreen.jsx";
import { HomeScreen } from "./screens/HomeScreen.jsx";
import { IndividualEventScreen } from "./screens/IndividualEventScreen.jsx";
import { ManageMembersScreen } from "./screens/ManageMembersScreen.jsx";
import { AddMemberScreen } from "./screens/AddMemberScreen.jsx";
import { FavoritesScreen } from "./screens/FavoritesScreen.jsx";
import { SearchEventScreen } from "./screens/SearchEventScreen.jsx";
import { ViewEventsScreen } from "./screens/ViewEventsScreen.jsx";
import { TransactionScreen } from "./screens/TransactionScreen.jsx";
import { ProductScreen } from "./screens/ProductScreen.jsx";
import { CustomerSearchResultsScreen } from "./screens/CustomerSearchResultsScreen.jsx";
import { CustomerSearchNoResultsScreen } from "./screens/CustomerSearchNoResultsScreen.jsx";
import { CreateCustomerScreen } from "./screens/CreateCustomerScreen.jsx";
import { EditEventScreen } from "./screens/EditEventScreen.jsx";
import { SearchCustomerScreen } from "./screens/SearchCustomerScreen.jsx";

export const ModalContents = ({ shopifyCustomerId }) => {
  const api = useApi();
  const [authToken, setAuthToken] = useState(null);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 3000; // 3 seconds

  useEffect(() => {
    let mounted = true;
    let retryTimeout = null;

    const fetchAuthToken = async (currentRetry = 0) => {
      if (!mounted) return;
      try {
        const response = await fetch(process.env.DBI_AUTH_URL, {
          method: "GET",
          headers: {
            accept: "application/json",
            username: process.env.REACT_DBI_AUTH_USERNAME,            
            password: process.env.REACT_DBI_AUTH_PASSWORD,
            bearertoken: process.env.REACT_DBI_AUTH_BEARERTOKEN,
          },
        });

        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Authentication token fetched successfully:", data);
        if (mounted) {
          setAuthToken(data.token);
          api.toast.show("Successfully connected to event management system");
        }
      } catch (error) {
        console.error("Error fetching authentication token:", error);
        if (mounted && currentRetry < MAX_RETRIES) {
          const nextRetry = currentRetry + 1;
          api.toast.show(`Connection failed. Retrying... (${nextRetry}/${MAX_RETRIES})`);
          retryTimeout = setTimeout(() => {
            fetchAuthToken(nextRetry);
          }, RETRY_DELAY);
        } else if (mounted) {
          api.toast.show("Failed to connect to event management system. Please try again later.", {
            error: true,
          });
        }
      }
    };

    fetchAuthToken(0);

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [api.toast]);

  const handleCreateEvent = () => {
    api.navigation.navigate("CreateEvent", { authToken });
  };

  return (
    <Navigator initialScreen="home">
      <HomeScreen
        name="home"
        onCreateEvent={handleCreateEvent}
        authToken={authToken}
        shopifyCustomerId={shopifyCustomerId}
      />
      <CreateEventScreen
        name="CreateEvent"
        authToken={authToken}
        shopifyCustomerId={shopifyCustomerId}
      />
      <IndividualEventScreen name="IndividualEvent" shopifyCustomerId={shopifyCustomerId} />
      <ManageMembersScreen name="ManageMembersScreen" />
      <AddMemberScreen name="AddMemberScreen" />
      <FavoritesScreen name="FavoritesScreen" />
      <SearchEventScreen name="SearchEvent" />
      <ViewEventsScreen name="ViewEvents" shopifyCustomerId={shopifyCustomerId} />
      <TransactionScreen name="TransactionHub" />
      <ProductScreen name="ProductScreen" />
      <CustomerSearchResultsScreen name="CustomerSearchResultsScreen" />
      <CustomerSearchNoResultsScreen name="CustomerSearchNoResultsScreen" />
      <CreateCustomerScreen name="CreateCustomerScreen" />
      <EditEventScreen name="EditEventScreen" />
      <SearchCustomerScreen name="SearchCustomerScreen" />
    </Navigator>
  );
};
