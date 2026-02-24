import {
  Banner,
  BlockStack,
  Button,
  InlineStack,
  Text,
  useApi,
} from "@shopify/ui-extensions-react/checkout";
import React, {useCallback, useState} from "react";

export default function DebugSessionToken() {
  const {sessionToken} = useApi();
  const [preview, setPreview] = useState("");

  const onPrint = useCallback(async () => {
    const token = await sessionToken.get();
    console.log("SHOPIFY_SESSION_TOKEN:", token);
    const p = `${token.slice(0, 18)}…${token.slice(-14)}`;
    setPreview(p);
  }, [sessionToken]);

  return (
    <BlockStack spacing="tight">
      <Banner title="Debug: Shopify Session Token" status="info">
        <InlineStack spacing="tight" blockAlignment="center">
          <Button kind="secondary" onPress={onPrint}>
            Print session token
          </Button>
          {preview && <Text appearance="subdued">Preview: {preview}</Text>}
        </InlineStack>
        <Text appearance="subdued">
          Abra o DevTools → Console, copie o valor de <Text emphasis="italic">SHOPIFY_SESSION_TOKEN</Text> e cole no Postman.
        </Text>
      </Banner>
    </BlockStack>
  );
}
