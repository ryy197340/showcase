import React, { useState, useEffect } from "react";
import {
  Text,
  Screen,
  ScrollView,
  Button,
  Stack,
  List,
  Section,
  useApi,
  SectionHeader,
  Banner,
  Icon,
  Image,
  Badge,
} from "@shopify/ui-extensions-react/point-of-sale";


const API_ENDPOINT = `${process.env.REACT_APP_MIDDLEWARE_URL}/US/orders/shopifyOrdersByEventUuid`;


export const TransactionScreen = () => {
  const api = useApi();
  const [params, setParams] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    console.log("Params received:", params);
    //TODO: Remove this once we have the API working. example eventUuid using to get orders
    const eventUuid = params?.eventUuid;
    //const eventUuid = "2269ace0-fefa-44b4-9c88-275c7330b7b2";
    console.log("Using eventUuid:", eventUuid);
    setEventData({
      eventUuid: eventUuid,
      eventType: params?.eventData?.eventType || "Event"
    });
        
    fetchOrders(eventUuid);
  }, [params]);

  const fetchOrders = async (eventUuid) => {
    try {
      console.log(`Fetching orders for event: ${eventUuid}`);
      setIsLoading(true);
      setError(null);
            
      const queryUrl = `${API_ENDPOINT}?eventUuid=${encodeURIComponent(eventUuid)}`;
      console.log(`Making GET request to: ${queryUrl}`);
      //TODO: Remove this once we have the API working
      // Make GET request with query parameter
      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',          
        }   
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      let result = await response.json();
      console.log("API response:", result);
      
      // For testing - mock data with enhanced product information matching Shopify Admin format
      // const result = {
      //   "success": true,
      //   "orderData": {
      //     "data": {
      //       "orders": {
      //         "edges": [
      //           {
      //             "node": {
      //               "name": "5581682",
      //               "lineItems": {
      //                 "edges": [
      //                   {
      //                     "node": {
      //                       "variant": {
      //                         "displayName": "Flutter Sleeve Floral Chiffon Dress - Pink Print / 12",
      //                         "sku": "V01747421",
      //                         "id": "gid://shopify/ProductVariant/44795228750009",
      //                         "product": {
      //                           "id": "gid://shopify/Product/8057385648313",
      //                           "title": "Flutter Sleeve Floral Chiffon Dress",
      //                           "handle": "flutter-sleeve-dress",
      //                           "vendor": "Dawn P3",
      //                           "product_type": "Apparel",
      //                           "status": "active",
      //                           "options": [
      //                             {
      //                               "name": "Color",
      //                               "values": ["Pink Print", "Blue", "White"]
      //                             },
      //                             {
      //                               "name": "Size",
      //                               "values": ["10", "12", "14"]
      //                             }
      //                           ],
      //                           "image": {
      //                             "src": "https://cdn.shopify.com/s/files/1/0584/3360/1721/files/786400ac-5e35-4aee-812e-a03c348db8c9-2.png?v=1741738810"
      //                           }
      //                         }
      //                       }
      //                     }
      //                   },
      //                   {
      //                     "node": {
      //                       "variant": {
      //                         "displayName": "Modern Canvas Tote Bag - Green",
      //                         "sku": "B12345678",
      //                         "id": "gid://shopify/ProductVariant/44795229044921",
      //                         "product": {
      //                           "id": "gid://shopify/Product/8057385877689",
      //                           "title": "Modern Canvas Tote Bag",
      //                           "handle": "modern-canvas-tote-bag",
      //                           "vendor": "Dawn P3",
      //                           "product_type": "Accessories",
      //                           "status": "active",
      //                           "options": [
      //                             {
      //                               "name": "Color",
      //                               "values": ["Green", "Blue", "Black"]
      //                             }
      //                           ],
      //                           "image": {
      //                             "src": "https://cdn.shopify.com/s/files/1/0584/3360/1721/files/9150424b-1a82-45da-bbab-01da487d4fec-2.png?v=1741738817"
      //                           }
      //                         }
      //                       }
      //                     }
      //                   },
      //                   {
      //                     "node": {
      //                       "variant": {
      //                         "displayName": "Gilded Vodka Collins - 750ml",
      //                         "sku": "GVC750",
      //                         "id": "gid://shopify/ProductVariant/44808354070713",
      //                         "product": {
      //                           "id": "gid://shopify/Product/8059942731961",
      //                           "title": "Gilded Vodka Collins",
      //                           "handle": "gilded-vodka-collins",
      //                           "vendor": "FYE",
      //                           "product_type": "Beverages",
      //                           "status": "active",
      //                           "options": [
      //                             {
      //                               "name": "Size",
      //                               "values": ["750ml", "1L"]
      //                             }
      //                           ],
      //                           "image": {
      //                             "src": "https://cdn.shopify.com/s/files/1/0584/3360/1721/files/70a459b6-74b5-44db-8a4e-614a408d9a8f-2.png?v=1742343620"
      //                           }
      //                         }
      //                       }
      //                     }
      //                   }
      //                 ]
      //               }
      //             }
      //           }
      //         ]
      //       }
      //     },
      //     "extensions": {
      //       "cost": {
      //         "requestedQueryCost": 212,
      //         "actualQueryCost": 8,
      //         "throttleStatus": {
      //           "maximumAvailable": 20000,
      //           "currentlyAvailable": 19992,
      //           "restoreRate": 1000
      //         }
      //       }
      //     }
      //   }
      // };
      
      if (result.success) {        
        const transformedOrders = [];
                
        if (result.orderData?.data?.orders?.edges) {
          const edges = result.orderData.data.orders.edges;
                  
          edges.forEach((edge, index) => {
            const orderNode = edge.node;
            if (!orderNode) return;
                      
            const lineItems = [];
            if (orderNode.lineItems?.edges) {
              orderNode.lineItems.edges.forEach(lineItemEdge => {
                const lineItemNode = lineItemEdge.node;
                if (!lineItemNode || !lineItemNode.variant) return;
                
                const variant = lineItemNode.variant;
                const product = variant.product || {};
                
                // Get the first image URL from the images edges array
                const imageUrl = product.images?.edges?.[0]?.node?.url || "";
                
                // Use product title from the API response
                const productTitle = product.title || variant.displayName?.split(' - ')[0] || "Unknown Product";
                const variantDetails = variant.displayName?.includes(' - ') ? 
                  variant.displayName.split(' - ')[1] : '';
                
                lineItems.push({
                  id: `line-item-${index}-${lineItems.length}`,
                  title: variant.displayName || "Unknown Product",
                  quantity: 1,
                  sku: variant.sku || "No SKU",
                  variant: {
                    id: variant.id,
                    sku: variant.sku || "No SKU",
                    price: "0.00",
                    options: product.options || []
                  },
                  product: {
                    id: product.id,
                    title: productTitle,
                    handle: product.handle || productTitle.toLowerCase().replace(/\s+/g, '-'),
                    vendor: product.vendor || "Shopify",
                    product_type: product.product_type || "Apparel",
                    image: {
                      src: imageUrl
                    }
                  }
                });
              });
            }
            
            transformedOrders.push({
              id: `order-${index}`, 
              name: orderNode.name || `#${index + 1}`,
              createdAt: new Date().toISOString(),
              customer: orderNode.customer ? {
                firstName: orderNode.customer.firstName || '',
                lastName: orderNode.customer.lastName || ''
              } : null,
              displayFinancialStatus: "UNKNOWN", 
              totalPrice: "0.00", 
              currencyCode: "USD",
              tags: [eventUuid], 
              lineItems
            });
          });
        }
        
        console.log(`Transformed ${transformedOrders.length} orders from API response`);
        setOrders(transformedOrders);
                
        if (transformedOrders.length > 0) {
          setExpandedOrders({ [transformedOrders[0].id]: true });
        }
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(`Failed to load order data: ${err.message}`);
      api.toast.show("Unable to display orders. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompareClick = () => {
    console.log("Comparing favorites against orders for display");
    api.toast.show("Checking if favorites match your orders");

    // Implementation details here
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleViewProduct = (lineItem) => {
    if (!lineItem) {
      api.toast.show("Unable to find product details");
      return;
    }

    const productForSearch = lineItem.product?.title || 
                           (lineItem.title?.includes(' - ') ? 
                             lineItem.title.split(' - ')[0].trim() : 
                             lineItem.title);
    
    console.log("Navigating to ProductScreen with:", {
      sku: lineItem.sku,
      product: productForSearch
    });
    
    api.toast.show(`Opening details for ${productForSearch}`);
    loadProductData(lineItem.sku, productForSearch);
  };

  const loadProductData = (sku, product) => {
    try {            
      api.navigation.navigate("ProductScreen", {
        sku: sku,
        product: product
      });
    } catch (err) {
      console.error("Error loading product data:", err);
      api.toast.show("Failed to load product details");
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
    }
  };

  const createOrderListData = () => {
    if (!orders || !Array.isArray(orders)) return [];
    
    return orders.map(order => {
      // Get customer name or fallback text
      const customerName = order.customer ? 
        `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : 
        'No Customer Info';

      return {
        id: order.id,
        leftSide: {
          label: `Order ${order.name || "Unknown"}`,
          subtitle: [
            { content: formatDate(order.createdAt) },
            { content: `${order.lineItems?.length || 0} items` },
            { content: customerName }
          ]
        },
        rightSide: {
          label: expandedOrders[order.id] ? "Hide Details" : "View Details",
          showChevron: true
        },
        onPress: () => toggleOrderExpand(order.id)
      };
    });
  };

  return (
    <Screen
      name="TransactionHub"
      title="Event Orders"
      onBack={() => api.navigation.pop()}
      onReceiveParams={setParams}
      presentation={{ sheet: true }}
    >
      <ScrollView>
        <Stack direction="vertical" gap="800" padding="400" alignItems="center">
          {eventData && (
            <Section>
              <Banner status="info" title={`Event: ${eventData.eventType || 'Unknown'}`}>
                <Text>Event ID: {eventData.eventUuid}</Text>
              </Banner>
            </Section>
          )}

          {isLoading ? (
            <Section>
              <Text>Loading orders...</Text>
            </Section>
          ) : error ? (
            <Section>
              <Stack direction="vertical" gap="400">
                <Text>{error}</Text>
                <Button 
                  title="Retry" 
                  onPress={() => fetchOrders(eventData?.eventUuid || DEFAULT_EVENT_UUID)} 
                />
              </Stack>
            </Section>
          ) : orders && orders.length > 0 ? (
            <>              
              <Section>                 
                <List data={createOrderListData()} title="Orders"/>
              </Section>
              {orders.map(order => 
                expandedOrders[order.id] && (
                  <ScrollView key={`expanded-${order.id}`}>
                    <Stack direction="vertical" gap="400" alignItems="center">
                      <Text fontWeight="bold">Products in Order {order.name}</Text>
                      {order.customer && (
                        <Text>Customer: {`${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()}</Text>
                      )}
                      {order.lineItems && order.lineItems.length > 0 ? (
                        order.lineItems.map(item => (
                          <Stack key={item.id} direction="vertical" gap="400" alignItems="center">                           
                            <Text fontWeight="bold">{`Product: ${item.product.title}`}</Text>
                            <Text>{`Variant: ${item.title.includes(' - ') ? item.title.split(' - ')[1] : ''}`}</Text>
                            <Text>{`SKU: ${item.sku || "No SKU"}`}</Text>
                            {item.quantity && <Text>{`Quantity: ${item.quantity}`}</Text>}
                            <Button
                              title="View Product"
                              onPress={() => handleViewProduct(item)}
                            />
                          </Stack>
                        ))
                      ) : (
                        <Text>No products in this order</Text>
                      )}
                    </Stack>
                  </ScrollView>
                )
              )}          
            </>
          ) : (
            <Section>
              <Stack direction="vertical" gap="400" padding="400" alignItems="center">
                <Text>No transactions have been placed for this event yet.</Text> 
              </Stack>
            </Section>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
};

