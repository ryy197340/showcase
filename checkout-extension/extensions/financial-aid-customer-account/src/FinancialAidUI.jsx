import {
  reactExtension,
  BlockStack,
  InlineLayout,
  Text,
  TextField,
  Button,
  View,
  Icon,
  Divider,
  Pressable,
  Tooltip,
  useCustomer
} from "@shopify/ui-extensions-react/customer-account";
import { useState, useCallback } from "react";

export default reactExtension(
  "customer-account.profile.block.render",
  () => <StudentIdLookup />
);

/* -------------------------------------------------------------------------- */
/*                                CONFIG/TOKEN                                */
/* -------------------------------------------------------------------------- */
const FIXED_SHOPIFY_SESSION_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczpcL1wvYmtzdHItc3RhZ2luZy5teXNob3BpZnkuY29tXC9jaGVja291dHMiLCJkZXN0IjoiYmtzdHItc3RhZ2luZy5teXNob3BpZnkuY29tIiwiYXVkIjoiMjM2MGNmZWY5ZTQ0MWVlNjNhMjVkMDY2ZTU5MTg1YzQiLCJleHAiOjE3NTYyNzcwMTcsIm5iZiI6MTc1NjI3NjcxNywiaWF0IjoxNzU2Mjc2NzE3LCJqdGkiOiI1MjE5ZGUwZC1lMTg4LTRlZmMtYjc5OC1lZWQyMTE5ZGVhNjkiLCJzdWIiOiJnaWQ6XC9cL3Nob3BpZnlcL0N1c3RvbWVyXC83OTMzMTM0MjQxOTkxIn0.kgB_8sam3wrd9kk6dozq5opR24aJThlFSL4u96zxfn4";

/* --------------------------- Backend calls -------------------------- */
async function studentIdLookupFetch(payload) {
  const res = await fetch(
    "https://ecom.shopify-integrations.follett.com/api/financial-aid/studentid-lookup",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Shopify-Session-Token": FIXED_SHOPIFY_SESSION_TOKEN,
      },
      body: JSON.stringify(payload),
    }
  );

  const text = await res.text();

  if (!res.ok) {
  let msg = text;
  try {
    const parsed = JSON.parse(text);

    if (parsed?.error) {
      // Pega o primeiro campo e o primeiro erro dentro dele
      const firstKey = Object.keys(parsed.error)[0];
      const firstError = parsed.error[firstKey]?.[0];
      msg = firstError || "An unexpected error occurred";
    }
  } catch {}

  throw new Error(
    String(msg).replace(/^Error:\s*/i, "").replace(/^HTTP\s+\d+:\s*/i, "").trim()
  );
}

  return text ? JSON.parse(text) : {};
}

/* ------------------------------- Helpers UI ------------------------------- */
function fmtMoney(n) {
  const v = Number(n ?? 0);
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
function fmtDate(mmddyyyy) {
  const s = String(mmddyyyy || "").replaceAll("\\/", "/").split("/");
  return s.length === 3 ? `${s[0]}/${s[1]}/${s[2].slice(-2)}` : (mmddyyyy || "");
}

/* ----------------------------- UI Extension ----------------------------- */
function StudentIdLookup() {
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [result, setResult] = useState(null);

  const shopDomain = "bkstr-staging.myshopify.com";
  const hasData = Array.isArray(result?.data) && result.data.length > 0;

  const handleLookup = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const payload = {
        student_id: studentId.trim(),
        customer_id: "",
        customer_email: "",
        shop_domain: shopDomain,
        financial_aid_type: "CAR-0007",
        epay_store_id: "7",
        amount: "",
        items: [],
        tax_amount: "0"
      };

      const json = await studentIdLookupFetch(payload);
      setResult(json);
    } catch (e) {
      setErrorMsg(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const Header = (
    <BlockStack spacing="none">
      <Text size="large" emphasis="base">FINANCIAL AID</Text>
      <Text appearance="subdued" size="base">
        Quickly view your available financial aid funds.
      </Text>
    </BlockStack>
  );

  const LearnMoreBar = (
    <InlineLayout
      background="subdued"
      cornerRadius="base"
      padding="base"
      columns={["fill", "auto"]}
      inlineAlignment="space-between"
      blockAlignment="center"
    >
      <Text>
        Learn more about how financial aid can be applied and the benefits available to you.
      </Text>
      <Icon source="chevron-right" />
    </InlineLayout>
  );

  return (
    <BlockStack padding="base" border="base" cornerRadius="large" spacing="loose">
      {Header}

      {!hasData && (
        <BlockStack spacing="base">
          <InlineLayout columns={["fill", "auto"]} spacing="base" blockAlignment="center">
            <TextField
              label="Student ID"
              accessibilityDescription="Student ID"
              id="student-id"
              value={studentId}
              onChange={setStudentId}
              disabled={loading}
              placeholder="Student ID"
            />
            <Button
              appearance="secondary"
              kind="secondary"
              loading={loading}
              onPress={handleLookup}
            >
              LOOK UP
            </Button>
          </InlineLayout>

          {errorMsg && (
            <InlineLayout
              columns={["auto", "fill"]}
              spacing="base"
              blockAlignment="center"
              background="subdued"
              cornerRadius="base"
              padding="base"
            >
              <Icon source="info" appearance="critical" />
              <Text appearance="critical">{errorMsg}</Text>
            </InlineLayout>
          )}

          {LearnMoreBar}
        </BlockStack>
      )}

      {hasData && (
        <BlockStack spacing="base">
          <View background="subdued" cornerRadius="base" padding="base">
            <BlockStack spacing="base">
              {result.data.map((fa, idx) => {
                const isLast = idx === result.data.length - 1;
                return (
                  <BlockStack key={String(fa.record_unique_id || idx)} spacing="tight">
                    <Text emphasis="bold" size="large">
                      {(fa?.description || "Financial Aid").toUpperCase()}
                    </Text>

                    <InlineLayout
                      columns={["auto", "auto", "auto"]}
                      spacing="base"
                      inlineAlignment="start"
                      blockAlignment="start"
                    >
                      <BlockStack spacing="none">
                        <InlineLayout columns={["auto", "auto"]} spacing="tight" blockAlignment="center">
                          <Text appearance="subdued">Available Credit</Text>
                          <Pressable
                            overlay={
                              <Tooltip>
                                How much you can use online now.
                              </Tooltip>
                            }
                          >
                            <Icon source="info" appearance="subdued" />
                          </Pressable>
                        </InlineLayout>
                        <Text emphasis="bold">{fmtMoney(fa?.available_balance)}</Text>
                      </BlockStack>

                      <BlockStack spacing="none">
                        <InlineLayout columns={["auto", "auto"]} spacing="tight" blockAlignment="center">
                          <Text appearance="subdued">Online End Date</Text>
                          <Pressable
                            overlay={
                              <Tooltip>
                                Last day to use funds online.
                              </Tooltip>
                            }
                          >
                            <Icon source="info" appearance="subdued" />
                          </Pressable>
                        </InlineLayout>
                        <Text emphasis="bold">{fmtDate(fa?.close_date)}</Text>
                      </BlockStack>

                      <BlockStack spacing="none">
                        <InlineLayout columns={["auto", "auto"]} spacing="tight" blockAlignment="center">
                          <Text appearance="subdued">In Store End Date</Text>
                          <Pressable
                            overlay={
                              <Tooltip>
                                Last day to use funds in-store.
                              </Tooltip>
                            }
                          >
                            <Icon source="info" appearance="subdued" />
                          </Pressable>
                        </InlineLayout>
                        <Text emphasis="bold">{fmtDate(fa?.close_date)}</Text>
                      </BlockStack>
                    </InlineLayout>

                    {!isLast && <Divider />}
                  </BlockStack>
                );
              })}
            </BlockStack>
          </View>

          {LearnMoreBar}
        </BlockStack>
      )}
    </BlockStack>
  );
}
