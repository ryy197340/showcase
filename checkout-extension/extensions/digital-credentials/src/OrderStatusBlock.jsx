import {
  reactExtension,
  BlockStack,
  Text,
  Button,
  View,
  Link,
  Pressable,
  useOrder,
  useMetafield,
  useCartLines
} from '@shopify/ui-extensions-react/customer-account';
import { useEffect, useState } from 'react';

export default reactExtension(
  'customer-account.order-status.block.render',
  () => <DigitalContentAccessBlock />
);

const VERSION = '1.0.8';

function DigitalContentAccessBlock() {

  const cartLines = useCartLines();

  var skipUI = true;
  
  for ( let i = 0 ; i < cartLines.length ; i++ ) {
    if (cartLines[i].merchandise.title == "Digital Delivery Fee") {
      skipUI = false;
    }
  }

  if (skipUI) {
    return;
  }

  console.log('[DigitalContentAccess] ===== Component Initialized =====');
  console.log('[DigitalContentAccess] Version:', VERSION);
  console.log('[DigitalContentAccess] API Version: 2025-07');
  
  const order = useOrder();
  console.log('[DigitalContentAccess] useOrder() result:', order);
  console.log('[DigitalContentAccess] Order ID:', order?.id);
  console.log('[DigitalContentAccess] Order Name:', order?.name);
  console.log('[DigitalContentAccess] Order object keys:', order ? Object.keys(order) : 'null');
  console.log('[DigitalContentAccess] Order object full:', JSON.stringify(order, null, 2));
  
  if (order?.metafields) {
    console.log('[DigitalContentAccess] Order has metafields directly:', order.metafields);
  }
  
  const metafieldFromHook = useMetafield({
    namespace: 'custom',
    key: 'digital_credentials'
  });
  console.log('[DigitalContentAccess] useMetafield() result:', metafieldFromHook);
  
  const [accessDataList, setAccessDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processMetafield = (metafield) => {
    console.log('[DigitalContentAccess] ===== processMetafield started =====');
    console.log('[DigitalContentAccess] Metafield value:', metafield.value);
    
    if (!metafield.value) {
      console.log('[DigitalContentAccess] Metafield exists but has no value');
      setLoading(false);
      return;
    }
    
    try {
      const jsonValue = JSON.parse(metafield.value);
      console.log('[DigitalContentAccess] Parsed JSON:', jsonValue);
      
      let credentialsList = [];
      
      if (jsonValue.credentials && Array.isArray(jsonValue.credentials)) {
        console.log('[DigitalContentAccess] Found credentials array with', jsonValue.credentials.length, 'items');
        
        jsonValue.credentials.forEach((credentialStr, index) => {
          try {
            const credential = JSON.parse(credentialStr);
            console.log(`[DigitalContentAccess] Processing credential ${index + 1}:`, credential);
            
            const { digitalContentAccessUrl, passcode, productTitle, sourceSystemTransactionId, 
                    responseCode, message, espCentralTransactionId, isSmartLicense, isProvisioned, sku } = credential;
            
            if (digitalContentAccessUrl && passcode) {
              console.log(`[DigitalContentAccess] ✓ Credential ${index + 1} has required fields`);
              credentialsList.push({
                url: digitalContentAccessUrl,
                passcode: passcode,
                productTitle: productTitle || '',
                sourceSystemTransactionId: sourceSystemTransactionId || '',
                responseCode: responseCode || '',
                message: message || '',
                espCentralTransactionId: espCentralTransactionId || '',
                isSmartLicense: isSmartLicense || false,
                isProvisioned: isProvisioned || false,
                sku: sku || ''
              });
            } else {
              console.warn(`[DigitalContentAccess] ✗ Credential ${index + 1} missing required fields`);
            }
          } catch (parseError) {
            console.error(`[DigitalContentAccess] Failed to parse credential ${index + 1}:`, parseError);
          }
        });
      } else {
        console.log('[DigitalContentAccess] Processing as single credential');
        const { digitalContentAccessUrl, passcode, productTitle, sourceSystemTransactionId, 
                responseCode, message, espCentralTransactionId, isSmartLicense, isProvisioned, sku } = jsonValue;

        if (digitalContentAccessUrl && passcode) {
          console.log('[DigitalContentAccess] ✓ Single credential has required fields');
          credentialsList.push({
            url: digitalContentAccessUrl,
            passcode: passcode,
            productTitle: productTitle || '',
            sourceSystemTransactionId: sourceSystemTransactionId || '',
            responseCode: responseCode || '',
            message: message || '',
            espCentralTransactionId: espCentralTransactionId || '',
            isSmartLicense: isSmartLicense || false,
            isProvisioned: isProvisioned || false,
            sku: sku || ''
          });
        } else {
          console.warn('[DigitalContentAccess] ✗ Single credential missing required fields');
        }
      }
      
      console.log('[DigitalContentAccess] Total valid credentials:', credentialsList.length);
      setAccessDataList(credentialsList);
      setLoading(false);
      
    } catch (parseError) {
      console.error('[DigitalContentAccess] Failed to parse metafield JSON:', parseError);
      console.error('[DigitalContentAccess] Parse error stack:', parseError.stack);
      setError('Failed to parse access data');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[DigitalContentAccess] ===== useEffect triggered =====');
    console.log('[DigitalContentAccess] Current state - loading:', loading, 'error:', error, 'accessDataList:', accessDataList);
    
    if (metafieldFromHook && metafieldFromHook.value) {
      console.log('[DigitalContentAccess] Found metafield from useMetafield hook, processing...');
      setLoading(true);
      processMetafield(metafieldFromHook);
      return;
    }
    
    if (order?.metafields && Array.isArray(order.metafields)) {
      console.log('[DigitalContentAccess] Found metafields in order object directly');
      const digitalCredentialsMetafield = order.metafields.find(
        m => m.namespace === 'custom' && m.key === 'digital_credentials'
      );
      if (digitalCredentialsMetafield) {
        console.log('[DigitalContentAccess] Found digital_credentials in order.metafields, processing...');
        setLoading(true);
        processMetafield(digitalCredentialsMetafield);
        return;
      }
    }
    
    if (!order?.id) {
      console.log('[DigitalContentAccess] No order ID found');
      return;
    }
    
    console.log('[DigitalContentAccess] Order found, proceeding to fetch data via GraphQL');
    setLoading(true);

    const fetchOrderData = async () => {
      console.log('[DigitalContentAccess] ===== fetchOrderData started =====');
      try {
        setLoading(true);
        setError(null);

        const orderId = order.id;
        console.log('[DigitalContentAccess] Order ID:', orderId);

        if (!orderId) {
          console.log('[DigitalContentAccess] No order ID found');
          setLoading(false);
          return;
        }

        const query = {
          query: `
            query getOrderMetafields($orderId: ID!) {
              order(id: $orderId) {
                id
                name
                metafields(identifiers: [{ namespace: "custom", key: "digital_credentials" }]) {
                  namespace
                  key
                  value
                  type
                }
              }
            }
          `,
          variables: {
            orderId: orderId
          }
        };

        console.log('[DigitalContentAccess] Sending GraphQL query:', JSON.stringify(query, null, 2));
        
        const response = await fetch(
          'shopify://customer-account/api/unstable/graphql.json',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
          }
        );
        
        const result = await response.json();
        console.log('[DigitalContentAccess] GraphQL response:', JSON.stringify(result, null, 2));

        if (result?.errors) {
          const hasAccessDenied = result.errors.some(
            error => error.extensions?.code === 'ACCESS_DENIED' || 
                     error.message?.includes('Access denied') ||
                     error.message?.includes('ACCESS_DENIED')
          );
          
          const hasProtectedDataError = result.errors.some(
            error => error.message?.includes('not approved') || 
                     error.message?.includes('protected customer data')
          );
          
          if (hasAccessDenied || hasProtectedDataError) {
            console.log('[DigitalContentAccess] Access denied or protected data error - metafield may not be accessible');
            setLoading(false);
            return;
          }
          
          console.error('[DigitalContentAccess] GraphQL errors:', result.errors);
          setError('Failed to load access information');
          setLoading(false);
          return;
        }

        const orderData = result?.data?.order;
        console.log('[DigitalContentAccess] Order data:', orderData);

        if (!orderData) {
          console.log('[DigitalContentAccess] Order not found with id:', orderId);
          setLoading(false);
          return;
        }

        const metafields = orderData.metafields ?? [];
        console.log('[DigitalContentAccess] Total metafields found:', metafields.length);
        console.log('[DigitalContentAccess] Metafields:', metafields.map(m => `${m.namespace}.${m.key}`));

        const digitalCredentialsMetafield = metafields.find(
          m => m.namespace === 'custom' && m.key === 'digital_credentials'
        );

        console.log('[DigitalContentAccess] digital_credentials metafield found:', !!digitalCredentialsMetafield);
        if (digitalCredentialsMetafield) {
          console.log('[DigitalContentAccess] digital_credentials metafield:', digitalCredentialsMetafield);
          console.log('[DigitalContentAccess] Calling processMetafield...');
          processMetafield(digitalCredentialsMetafield);
        } else {
          console.log('[DigitalContentAccess] digital_credentials metafield not found');
          console.log('[DigitalContentAccess] Available namespaces:', [...new Set(metafields.map(m => m.namespace))]);
          console.log('[DigitalContentAccess] Available metafield keys:', metafields.map(m => `${m.namespace}.${m.key}`));
          console.log('[DigitalContentAccess] Setting loading to false - no metafield found');
          setLoading(false);
        }
      } catch (err) {
        console.error('[DigitalContentAccess] Error:', err);
        setError('Failed to load access information: ' + err.message);
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [order, metafieldFromHook]);

  console.log('[DigitalContentAccess] ===== Rendering UI =====');
  console.log('[DigitalContentAccess] Render state - loading:', loading, 'error:', error, 'accessDataList:', accessDataList.length);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const viewElements = document.querySelectorAll('[data-testid="ui-extension-point-wrapper"] > div > div');
        if (viewElements.length > 0) {
          const contentDiv = Array.from(viewElements).find(el => 
            el.textContent?.includes('Digital Content Access')
          );
          if (contentDiv) {
            contentDiv.style.backgroundColor = '#fff';
            contentDiv.style.borderColor = '#fff';
          }
        }
        
        accessDataList.forEach(accessData => {
          if (accessData.url) {
            const links = document.querySelectorAll(`a[href="${accessData.url}"]`);
            links.forEach(link => {
              link.setAttribute('target', '_blank');
              link.setAttribute('rel', 'noopener noreferrer');
            });
          }
        });
      } catch (err) {
        console.error('[DigitalContentAccess] Error setting background/link:', err);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [accessDataList, loading, error]);
  
  return (
    <View
      cornerRadius="base"
      padding="base"
    >
      <BlockStack spacing="base">
        <Text size="base" emphasis="bold">
          Digital Content Access
        </Text>
        {loading ? (
          <Text size="base">Loading access information...</Text>
        ) : error ? (
          <BlockStack spacing="tight">
            <Text size="base">
              Digital access information is pending. It may take up to 10 minutes for the information to be updated.
            </Text>
          </BlockStack>
        ) : accessDataList.length > 0 ? (
          <BlockStack spacing="base">
            {accessDataList.map((accessData, index) => (
              <View
                key={index}
                cornerRadius="base"
                padding="base"
                border="base"
              >
                <BlockStack spacing="tight">
                  {accessData.productTitle && (
                    <Text size="base" emphasis="bold">
                      {accessData.productTitle}
                    </Text>
                  )}
                  <Text size="base" emphasis="bold">
                    Access Code: {accessData.passcode}
                  </Text>
                  {accessData.url && (
                    <Link to={accessData.url}>
                      <View
                        cornerRadius="base"
                        padding="base"
                        border="base"
                        background="base"
                      >
                        <Text 
                          size="base" 
                          emphasis="bold"
                          alignment="center"
                        >
                          ACCESS CONTENT →
                        </Text>
                      </View>
                    </Link>
                  )}
                </BlockStack>
              </View>
            ))}
          </BlockStack>
        ) : (
          <BlockStack spacing="tight">
            <Text size="base">
              Digital access information is pending. It may take up to 10 minutes for the information to be updated.
            </Text>
          </BlockStack>
        )}
      </BlockStack>
    </View>
  );
}