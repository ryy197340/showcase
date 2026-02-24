import React, { useState, useEffect } from 'react'

import {Screen, ScrollView, Navigator, reactExtension,TextField, Button, Banner, useApi, Dialog } from '@shopify/ui-extensions-react/point-of-sale'
import LoginScreen from './login-screen';

const Modal = () => {
  const [customerData, setCustomerData] = useState({
    organizationName: "",
    state: "",
    exemptionId: "",
    customerName: "",
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [apiCallInProgress, setApiCallInProgress] = useState<boolean>(false);
  const api=useApi();

  const handleChange = (field: string, value: string) => {
    setCustomerData((prev) => ({
      ...prev,
      [field]: value,
    }));
    const newErrors = { ...errors };
    delete newErrors[field];
    setErrors(newErrors);
  };

  const getErrorForField = (field: string): string | undefined => {
    return field in errors ? errors[field] : undefined;
  };

    const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!customerData.organizationName?.trim())
      newErrors.organizationName = "Organization Name is required";
    if (!customerData.state?.trim())
      newErrors.state = "State name is required";
    if (!customerData.exemptionId?.trim()) newErrors.exemptionId = "Exemption Id is required";
    if (!customerData.customerName?.trim()) newErrors.customerName = "customerName is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

    const handleApiCall =  async() => {
        setLoading(true);
        try {
          await handleSubmit();
        } catch (error) {
          setErrors({apiResponse: "Something went wrong. Please try again."});
          return
        } 
        setLoading(false);    
    }

  const handleSubmit=async()=>{ 
    setIsSubmitted(true);
    if (!validateForm()) {
      return;
    }
    if(customerData?.exemptionId)
        api.cart.addCartProperties({"Tax Exempt Number" :  customerData?.exemptionId})
    
    const middlewareResponse=await fetch(`${process.env.REACT_APP_MIDDLEWARE_URL}/${process.env.REACT_APP_LOCALE}/customers/updateCustomerMetafeild`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationName: customerData?.organizationName,
        state: customerData?.state,
        exemptionId: customerData?.exemptionId,
        customerName: customerData?.customerName,
        customerId: api.customer?.id,
      }),
    });
    const jsonResponse = await middlewareResponse.json();
    if(!jsonResponse?.success)
      setErrors({apiResponse: JSON.stringify(jsonResponse)});
    else
      api.navigation.dismiss(); 
  }

  useEffect(() => {
    if (api.customer && !apiCallInProgress) {
      const removeCustomerTaxExemptStatus = async () => {
        try {
          setApiCallInProgress(true);
          
          const response = await fetch(
            `${process.env.REACT_APP_MIDDLEWARE_URL}/${process.env.REACT_APP_LOCALE}/customers/removeCustomerTaxExemptStatus`, 
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                customerId: api.customer?.id,
              }),
            }
          );
          
          if (response.ok) {
            const data = await response.json().catch(() => null);
          }
        } catch (error) {
          setApiCallInProgress(false);
        } finally {
          setApiCallInProgress(false);
        }
      };

      removeCustomerTaxExemptStatus();
    }
  }, []);

  return (
    <Navigator>
      <LoginScreen/>
      <Screen
      isLoading={loading}
      name="tax-override-modal"
      title="Tax Override"
      overrideNavigateBack={() => {
        if (!validateForm()|| !isSubmitted) {
          setDialogVisible((prev)=>true);
          return;
        }
        api.navigation.dismiss();
      }}
      >
        <ScrollView>
            {<Dialog
            type="alert"
            title="Alert"
            content="Please Submit Details First"
            actionText="Confirm"
            onAction={()=>{setDialogVisible(false)}}
            showSecondaryAction={false}
            isVisible={dialogVisible}
          />}
          {Object.keys(errors).length > 0 &&  <Banner title={errors?.apiResponse ?errors?.apiResponse:'Please Provide all required data'} variant='error' visible hideAction/>}
          <TextField
            label="Name"
            placeholder="Input your name here"
            required={true}
            error={getErrorForField('customerName')}
            value={customerData?.customerName}
            onChange={(value)=>handleChange('customerName', value)}
          />
          <TextField
            label="Organization Name"
            placeholder="Input your organization name here"
            required={true}
            error={getErrorForField('organizationName')}
            value={customerData?.organizationName}
            onChange={(value) => handleChange('organizationName', value)} 
          />
          <TextField
            label="State"
            placeholder="Input your state here"
            required={true}
            error={getErrorForField('state')}
            value={customerData?.state}
            onChange={(value) => handleChange('state', value)}
          />

          <TextField
            label="Exemption ID"
            placeholder="Input your exemption ID here"
            required={true}
            error={getErrorForField('exemptionId')}
            value={customerData?.exemptionId}
            onChange={(value) => handleChange('exemptionId', value)}

          />
          <Button
            title='Submit'
            type='primary'
            isDisabled={loading}
            onPress={handleApiCall}    
            />
        </ScrollView>
      </Screen>
    </Navigator>
  )
}

export default reactExtension('pos.customer-details.action.render', () => <Modal />)