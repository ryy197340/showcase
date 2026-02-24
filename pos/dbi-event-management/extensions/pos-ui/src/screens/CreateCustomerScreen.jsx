import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  TextField,
  EmailField,
  NumberField,
  Screen,
  ScrollView,
  Stack,
  useApi,
  Button,
  useCartSubscription,
} from "@shopify/ui-extensions-react/point-of-sale";

export const CreateCustomerScreen = () => {
  const api = useApi();
  const [params, setParams] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const cart = useCartSubscription();

  const [customer, setCustomer] = useState({
    customerUuid: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (params?.customerData) {
      setCustomer((prev) => ({
        ...prev,
        customerUuid: params.customerData.customerUuid || "",
        firstName: params.customerData.firstName || "",
        lastName: params.customerData.lastName || "",
        email: params.customerData.email || "",
        phone: params.customerData.phone || "",
      }));
            
      if (params.customerData.customerUuid) {
        checkShopifyCustomer(params.customerData.customerUuid);
      }
    } else if (params?.searchQuery) {
      setCustomer((prev) => ({
        ...prev,
        email: params.searchQuery.email || "",
        phone: params.searchQuery.phone || "",
      }));
    }
  }, [params?.customerData, params?.searchQuery]);
  
  const checkShopifyCustomer = async (customerUuid) => {
    if (!customerUuid || !params?.authToken) return;
    
    try {
      setIsLoading(true);
      
      api.toast.show("Checking customer in Shopify...");
      
      const response = await fetch(
        `${process.env.REACT_APP_MIDDLEWARE_URL}/us/customers/getShopifyCustomerByUuid`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerUuid: customerUuid,
            email: customer.email,
            locale: process.env.REACT_APP_DEFAULT_LOCALE || "US",
          }),
        }
      );
      
      if (!response.ok) {
        console.error("Error checking Shopify customer:", response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log("Customer check response:", data);
      
      if (data.success && data.data?.shopifyCustomerId) {
        const shopifyCustomerId = data.data.shopifyCustomerId;      
        
        api.cart.setCustomer({ id: Number(shopifyCustomerId) });
        api.toast.show("Customer set to cart");
        
        if (params?.eventUuid) {
          api.navigation.navigate("ManageMembersScreen", {
            eventUuid: params.eventUuid,
            authToken: params.authToken,
          });
        } else {
          api.navigation.pop();
        }
      } else {        
        api.toast.show("Customer not in Shopify - please click Create to add them");
      }
    } catch (error) {
      console.error("Error checking Shopify customer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidName = (name) => /^[A-Za-z]+$/.test(name);
  
  const isValidPhone = (phone) => {
    return /^\+[1-9]\d{1,14}$/.test(phone) || /^\d{10,15}$/.test(phone);
  };
  
  const formatPhoneForShopify = (phone) => {
    if (!phone) return "";
    
    const digitsOnly = phone.replace(/\D/g, "");
    
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    
    if (digitsOnly.length > 10) {
      return `+${digitsOnly}`;
    }
    
    return `+${digitsOnly}`;
  };

  const validateFields = () => {
    const newErrors = {};

    if (!isValidName(customer.firstName)) {
      newErrors.firstName = "First name must contain only letters.";
    }
    if (!isValidName(customer.lastName)) {
      newErrors.lastName = "Last name must contain only letters.";
    }
    if (customer.phone && !isValidPhone(customer.phone)) {
      newErrors.phone = "Enter a valid phone number (at least 10 digits).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setCustomer((prevCustomer) => ({
      ...prevCustomer,
      [field]: value,
    }));
    setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
  };

  const handleCreateCustomer = async () => {
    if (!validateFields()) {
      api.toast.show("Please fix validation errors before submitting.");
      return;
    }

    try {
      setIsLoading(true);
      
      const customerUuid = customer.customerUuid || uuidv4();
      const isExistingDbiCustomer = !!customer.customerUuid;
      
      const formattedPhone = formatPhoneForShopify(customer.phone);
      
      const customerData = {
        ...customer,
        customerUuid: customerUuid,
      };

      setCustomer(customerData);

      if (!isExistingDbiCustomer) {
        
        const response = await fetch(`${process.env.CUSTOMER_HUB_BASE_URL}/v1/information`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "x-appid": process.env.REACT_DEV_APP_ID,
            authorizationToken: params?.authToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone,
            customerUuid: customerUuid,
            digitalProperties: ["website"],
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create customer: ${response.statusText}`);
        }

        api.toast.show("Customer saved to DBI system");
      } else {
        console.log("Using existing DBI customer - skipping DBI creation");
      }
      
      const eventType = customer.customerUuid ? "update" : "create";
      api.toast.show(`Middleware event type: ${eventType}`);      
      const middlewareCustomerData = {
        ...customerData,
        phone: formattedPhone
      };
            
      const profileResponse = await fetch(
        `${process.env.REACT_APP_MIDDLEWARE_URL}/us/customers/updateProfileInfo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: {
              next: middlewareCustomerData,
              type: eventType
            },
          }),
        }
      );
            
      if (!profileResponse.ok) {
        throw new Error(`Failed to create Shopify profile: ${profileResponse.statusText}`);
      }

      const profileData = await profileResponse.json();
      console.log("Middleware response:", profileData);
      
      if (!profileData.data) {
        throw new Error("No Shopify customer ID returned");
      }
      
      const customerGid = profileData.data;
      if (!customerGid) {
        throw new Error("Invalid customer ID returned from Shopify");
      }
      
      const shopifyCustomerId = Number(customerGid.replace("gid://shopify/Customer/", ""));
      
      if (isNaN(shopifyCustomerId)) {
        throw new Error("Invalid Shopify customer ID format");
      }
      
      api.cart.setCustomer({ id: shopifyCustomerId });
      api.toast.show("Customer set to cart");

      if (params?.eventUuid) {
        const eventResponse = await fetch(
          `${process.env.REACT_APP_EVENTS_API_URL}/${params.eventUuid}/member`,
          {
            method: "POST",
            headers: {
              accept: "application/json",
              "x-appid": process.env.REACT_DEV_APP_ID,
              authorizationToken: params?.authToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify([{ customerUuid: customerUuid, role: "Other", isOwner: false }]),
          }
        );

        if (!eventResponse.ok) {
          throw new Error(`Failed to add member: ${eventResponse.statusText}`);
        }

        api.toast.show("Member added to event");
        console.log("Customer successfully added to event");
        
        api.navigation.navigate("ManageMembersScreen", {
          eventUuid: params.eventUuid,
          authToken: params.authToken,
        });
      } else {
        api.navigation.pop();
      }
      
      setCustomer({
        customerUuid: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      });
    } catch (error) {
      console.error("Error:", error);
      api.toast.show(`Unable to create customer: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen
      name="CreateCustomerScreen"
      title="Create & Add Customer"
      presentation={{ sheet: true }}
      onReceiveParams={setParams}>
      <ScrollView>
        <Stack direction="vertical" gap="800" padding="400" alignItems="center">
          <TextField
            label="First Name"
            placeholder="Enter first name"
            required
            value={customer.firstName}
            onChange={(value) => handleChange("firstName", value)}
            error={errors.firstName}
          />
          <TextField
            label="Last Name"
            placeholder="Enter last name"
            required
            value={customer.lastName}
            onChange={(value) => handleChange("lastName", value)}
            error={errors.lastName}
          />
          <EmailField
            label="Email"
            placeholder="example@email.com"
            required
            value={customer.email}
            onChange={(value) => handleChange("email", value)}
          />
          <NumberField
            label="Phone Number"
            placeholder="1234567890"
            helpText="Enter at least 10 digits without spaces or special characters"
            required
            value={customer.phone}
            onChange={(value) => handleChange("phone", value)}
            error={errors.phone}
          />
          <Button
            title={isLoading ? "Processing..." : "Create & Add Customer"}
            onPress={handleCreateCustomer}
            disabled={isLoading}
            loading={isLoading}
          />
        </Stack>
      </ScrollView>
    </Screen>
  );
};
