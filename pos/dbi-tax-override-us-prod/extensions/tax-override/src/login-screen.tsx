import {
  ScrollView,
  Screen,
  Banner,
  TextField,
  Button,
  useApi,
} from "@shopify/ui-extensions-react/point-of-sale";
import {useState } from "react";
import {
  CUSTOM_DBI_APPROVAL,
  LOGIN_APPROVE,
  LOGIN_LABEL,
  SCREEN_LOGIN,
} from "./constants";

const LoginScreen = () => {
  const [empId, setEmpId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const api = useApi<"pos.home.modal.render">();

  const navigateToTaxScreen = () => {
    setBtnLoading(true);
    fetch(process.env.REACT_APP_DBI_DEV_AUTH_URL as string, {
      headers: {
        accept: "application/json",
        username: process.env.REACT_APP_DBI_AUTH_USER as string,
        password: process.env.REACT_APP_DBI_AUTH_PASSWORD as string,
        bearertoken: process.env.REACT_APP_DBI_AUTH_TOKEN as string,
      },
    }).then(async (tokenResponse) => {
      const tokenJson = await tokenResponse.json();
      fetch(process.env.REACT_APP_MIDDLEWARE_ENDPOINT as string, {
        method: "POST",
        headers: {
          authorizationToken: tokenJson.token,
          "x-appid": "postman",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: empId,
        }),
      }).then((response) => {
        if (response.ok) {
          response.json().then((data) => {
            if (data.isAdmin) {
                api.navigation.navigate("tax-override-modal");
            } else {
              setErrorMessage("You are not authorized to access this feature.");
            }
          }).finally(()=>{
            setBtnLoading(false); 
          });
        } else {
          setErrorMessage("Invalid employee ID.");
          setBtnLoading(false); 
        }
        setEmpId("");
      });
    }).catch((error) => {
      setErrorMessage("Something went wrong. Please try again."+JSON.stringify(error));
    });

    
  };

  return (
    <Screen
      name={SCREEN_LOGIN}
      title={CUSTOM_DBI_APPROVAL}
      onNavigateBack={() => setErrorMessage("")}
      isLoading={loading}
    >
      <ScrollView>
        {errorMessage && (
          <Banner title={errorMessage} variant="error" visible hideAction />
        )}
        <TextField
          label={LOGIN_LABEL}
          placeholder=""
          required={true}
          value={empId}
          onChange={setEmpId}
        />
        <Button
          title={LOGIN_APPROVE}
          type="primary"
          isLoading={btnLoading}
          isDisabled={empId.length == 0}
          onPress={() => {
            try {
              setLoading(true);
              setErrorMessage("");
              navigateToTaxScreen();
            } catch (error) {
              setErrorMessage("Something went wrong. Please try again.");
            } finally {
              setLoading(false);
            }
          }}
        />
      </ScrollView>
    </Screen>
  );
};

export default LoginScreen;
