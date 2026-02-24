import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';

export default async () => {
  render(<Extension />, document.body);
}

function Extension() {
  const {i18n, data, extension: {target}} = shopify;
  console.log('Extension data:', data);
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFunds, setShowFunds] = useState(false);
  const [accountsData, setAccountsData] = useState([]);
  const [checkingFunds, setCheckingFunds] = useState(false);
  const [error, setError] = useState(null);
  const [noHoldFound, setNoHoldFound] = useState(false);
  const [orderBlocked, setOrderBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [activeFA, setActiveFA] = useState("");
  const [restrictedItems, setRestrictedItems] = useState([]);
  const [fulfillmentOrders, setFulfillmentOrders] = useState([]);
  const [releasingHolds, setReleasingHolds] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [hasFinancialAid, setHasFinancialAid] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    (async function getOrderInfo() {
      try {
        setError(null);
        const getOrderQuery = {
          query: `query Order($id: ID!) {
            order(id: $id) {
              id
              name
              email
              createdAt
              displayFulfillmentStatus
              cancelledAt
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customAttributes {
                key
                value
              }
              note
              tags
              customer {
                id
                displayName
                email
              }
              lineItems(first: 10) {
                edges {
                  node {
                    id
                    name
                    quantity
                    sku
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                    variant {
                      id
                      title
                    }
                  }
                }
              }
              fulfillmentOrders(first: 10) {
                edges {
                  node {
                    id
                    status
                    assignedLocation {
                      name
                    }
                    lineItems(first: 10) {
                      edges {
                        node {
                          id
                          totalQuantity
                          lineItem {
                            id
                            name
                            sku
                            customAttributes {
                              key
                              value
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }`,
          variables: {id: data.selected[0].id},
        };

        const res = await fetch("shopify:admin/api/graphql.json", {
          method: "POST",
          body: JSON.stringify(getOrderQuery),
        });

        if (!res.ok) {
          throw new Error('Network error');
        }

        const result = await res.json();
        
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }
        
        const order = result.data.order;
        setOrderData(order);
        
        // Filter and set fulfillment orders with ON_HOLD status
        const onHoldFulfillments = order.fulfillmentOrders.edges
          .filter(edge => edge.node.status === 'ON_HOLD')
          .map(edge => edge.node);
        
        setFulfillmentOrders(onHoldFulfillments);
        
        if (onHoldFulfillments.length === 0) {
          setNoHoldFound(true);
        }

        // Check if order has financial aid data
        const hasLookupData = order.customAttributes?.some(
          attr => attr.key === 'follett_lookup_data'
        );
        if (!hasLookupData) {
          setHasFinancialAid(false);
        }

        // Check if order is cancelled or fulfilled
        if (order.cancelledAt) {
          setOrderBlocked(true);
          setBlockedReason('cancelled');
        } else if (order.displayFulfillmentStatus === 'FULFILLED') {
          setOrderBlocked(true);
          setBlockedReason('fulfilled');
        }
        
        console.log('=== ORDER DATA ===');
        console.log('Full order:', order);
        console.log('Order ID:', order.id);
        console.log('Order name:', order.name);
        console.log('Customer:', order.customer);
        console.log('Total:', order.totalPriceSet.shopMoney);
        console.log('Note attributes (customAttributes):', order.customAttributes);
        console.log('Line items:', order.lineItems.edges.map(e => e.node));
        console.log('Tags:', order.tags);
        console.log('Note:', order.note);
        console.log('Fulfillment Orders ON_HOLD:', onHoldFulfillments);
        
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order data. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [data.selected]);

  // Auto-check funds when order data is loaded
  useEffect(() => {
    if (orderData && !orderBlocked && !noHoldFound && !showFunds) {
      handleCheckFunds();
    }
  }, [orderData]);

  const handleCheckFunds = async () => {
    setCheckingFunds(true);
    setError(null);
    setAccountsData([]);
    
    try {
      // 1. Search look up data in order attributes
      const lookupAttr = orderData?.customAttributes?.find(
        attr => attr.key === 'follett_lookup_data'
      );
      
      if (!lookupAttr) {
        setError('This order was not created using Financial Aid');
        setShowFunds(true); // Show the UI so the banner appears
        return;
      }

      const lookupDataRaw = lookupAttr.value;
      console.log('[CHECK FUNDS] Raw lookup data:', lookupDataRaw);
      
      const parsedLookupData = JSON.parse(lookupDataRaw);
      console.log('[CHECK FUNDS] Parsed lookup data:', parsedLookupData);
      
      if (!parsedLookupData.request_payload) {
        throw new Error('Invalid lookup data format');
      }

      const payload = parsedLookupData.request_payload;

      var endpoint = '';
      
      console.log('[CHECK FUNDS] Sending request to API:', payload);

      if (payload.shop_domain == "bkstr-9975.myshopify.com") {
        endpoint = "https://ecom.shopdev-integrations.follett.com/api/financial-aid/studentid-lookup"
      } else {
        endpoint = "https://ecom.shopify-integrations.follett.com/api/financial-aid/studentid-lookup"
      }

      payload.amount = "100000";
      payload.total_amount = "100000"

      // 2. Student ID Look up
      const response = await fetch(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Shopify-Session-Token': await shopify.auth.idToken()
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const apiResult = await response.json();
      console.log('[CHECK FUNDS] API Response:', apiResult);

      if (!apiResult?.data || !Array.isArray(apiResult.data) || apiResult.data.length === 0) {
        throw new Error('No financial aid accounts found in response');
      }

      const giftCardsAttr = orderData?.customAttributes?.find(
        attr => attr.key === 'follett_giftcards'
      );
      
      let appliedGiftCards = [];
      if (giftCardsAttr) {
        const giftCardData = giftCardsAttr.value;
        console.log('[CHECK FUNDS] Raw gift card data:', giftCardData);
        
        const parsedGiftCards = JSON.parse(giftCardData);
        console.log('[CHECK FUNDS] Parsed gift card data:', parsedGiftCards);
        console.log('Description:', parsedGiftCards[0].description);
        setActiveFA(parsedGiftCards[0].description || null);
        
        if (Array.isArray(parsedGiftCards)) {
          appliedGiftCards = parsedGiftCards.filter(gc => gc.source === 'financialAid');
        }
      }

      const giftCardsByFaId = {};
      appliedGiftCards.forEach(gc => {
        if (gc.financialAidId) {
          giftCardsByFaId[gc.financialAidId] = gc;
        }
      });

      console.log('[CHECK FUNDS] Gift cards by FA ID:', giftCardsByFaId);

      // 5. Match API data with attributes
      const currentDate = new Date();
      const accounts = apiResult.data.map(account => {
        const faId = String(account.record_unique_id);
        const appliedGiftCard = giftCardsByFaId[faId];
        
        // Check if this specific account's close date is expired
        let isExpired = false;
        if (account.close_date) {
          const closeDate = new Date(account.close_date);
          isExpired = closeDate < currentDate;
        }
        
        return {
          id: faId,
          description: account.description || 'Financial Aid Account',
          availableBalance: Number(account.available_balance || 0),
          closeDate: account.close_date || null,
          isExpired: isExpired,
          eligibleAmount: Number(account.eligible_amount || 0),
          appliedAmount: appliedGiftCard ? Number(appliedGiftCard.amount || 0) : 0,
          giftCardCode: appliedGiftCard ? appliedGiftCard.code : null,
          hasSufficientFunds: appliedGiftCard 
            ? Number(account.eligible_amount || 0) >= Number(appliedGiftCard.amount || 0)
            : true
        };
      });

      console.log('[CHECK FUNDS] Accounts with gift card data:', accounts);

      // Extract all restricted items from all accounts
      const allRestrictedItems = [];
      apiResult.data.forEach(account => {
        if (account.restricted_items && Array.isArray(account.restricted_items)) {
          allRestrictedItems.push(...account.restricted_items);
        }
      });
      setRestrictedItems([...new Set(allRestrictedItems)]); // Remove duplicates
      console.log('[CHECK FUNDS] Restricted items SKUs:', allRestrictedItems);

      setAccountsData(accounts);
      setShowFunds(true);
      
    } catch (err) {
      console.error('[CHECK FUNDS] Error:', err);
      setError(err.message || 'Failed to check funds');
      setAccountsData([]);
    } finally {
      setCheckingFunds(false);
    }
  };

  const handleReleaseAllHolds = async () => {
    setReleasingHolds(true);
    setError(null);
    
    try {
      // Release all fulfillment orders sequentially and track which ones need fulfillment
      const fulfillmentsToFulfill = [];
      
      for (const fulfillmentOrder of fulfillmentOrders) {
        // Check if this fulfillment contains rental collateral items
        const hasRentalCollateral = fulfillmentOrder.lineItems.edges.some(edge => {
          const customAttrs = edge.node.lineItem.customAttributes || [];
          return customAttrs.some(attr => 
            attr.key === '_Reason' && attr.value === 'Rental Collateral'
          );
        });
        
        const releaseHoldMutation = {
          query: `mutation fulfillmentOrderReleaseHold($id: ID!) {
            fulfillmentOrderReleaseHold(id: $id) {
              fulfillmentOrder {
                id
                status
              }
              userErrors {
                field
                message
              }
            }
          }`,
          variables: {
            id: fulfillmentOrder.id
          }
        };

        console.log('Releasing hold:', JSON.stringify(releaseHoldMutation, null, 2));

        const res = await fetch("shopify:admin/api/graphql.json", {
          method: "POST",
          body: JSON.stringify(releaseHoldMutation),
        });

        const result = await res.json();
        console.log('Release hold result:', result);
        
        if (result.data?.fulfillmentOrderReleaseHold?.userErrors?.length > 0) {
          throw new Error(result.data.fulfillmentOrderReleaseHold.userErrors[0].message);
        } else if (result.errors) {
          throw new Error(result.errors[0].message);
        } else {
          console.log('Hold released successfully for:', fulfillmentOrder.id);
          
          // If this fulfillment has rental collateral, mark it for fulfillment
          if (hasRentalCollateral) {
            fulfillmentsToFulfill.push(fulfillmentOrder.id);
          }
        }
      }
      
      // Fulfill the rental collateral fulfillment orders
      for (const fulfillmentOrderId of fulfillmentsToFulfill) {
        try {
          const fulfillMutation = {
            query: `mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
              fulfillmentCreateV2(fulfillment: $fulfillment) {
                fulfillment {
                  id
                  status
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
            variables: {
              fulfillment: {
                lineItemsByFulfillmentOrder: [
                  {
                    fulfillmentOrderId: fulfillmentOrderId
                  }
                ],
                notifyCustomer: false
              }
            }
          };

          console.log('Fulfilling rental collateral:', JSON.stringify(fulfillMutation, null, 2));

          const fulfillRes = await fetch("shopify:admin/api/graphql.json", {
            method: "POST",
            body: JSON.stringify(fulfillMutation),
          });

          const fulfillResult = await fulfillRes.json();
          console.log('Fulfill result:', fulfillResult);

          if (fulfillResult.data?.fulfillmentCreateV2?.userErrors?.length > 0) {
            console.error('Error fulfilling rental collateral:', fulfillResult.data.fulfillmentCreateV2.userErrors);
          } else if (fulfillResult.errors) {
            console.error('Error fulfilling rental collateral:', fulfillResult.errors);
          } else {
            console.log('Rental collateral fulfilled successfully for:', fulfillmentOrderId);
          }
        } catch (fulfillErr) {
          console.error('Error fulfilling rental collateral:', fulfillErr);
          // Don't throw - continue with other operations
        }
      }
      
      // Add tag to order after all holds are released
      try {
        const addTagMutation = {
          query: `mutation tagsAdd($id: ID!, $tags: [String!]!) {
            tagsAdd(id: $id, tags: $tags) {
              node {
                id
              }
              userErrors {
                field
                message
              }
            }
          }`,
          variables: {
            id: orderData.id,
            tags: ['financial-aid-verified']
          }
        };

        console.log('Adding tag:', JSON.stringify(addTagMutation, null, 2));

        const tagRes = await fetch("shopify:admin/api/graphql.json", {
          method: "POST",
          body: JSON.stringify(addTagMutation),
        });

        const tagResult = await tagRes.json();
        console.log('Tag result:', tagResult);

        if (tagResult.data?.tagsAdd?.userErrors?.length > 0) {
          console.error('Error adding tag:', tagResult.data.tagsAdd.userErrors);
        } else {
          console.log('Tag added successfully');
        }
      } catch (tagErr) {
        console.error('Error adding tag:', tagErr);
        // Don't throw - tag is optional, don't fail the whole operation
      }
      
      // Clear all fulfillment orders from state
      setFulfillmentOrders([]);
      
    } catch (err) {
      console.error('Error releasing holds:', err);
      setError(err.message || 'Failed to release holds');
    } finally {
      setReleasingHolds(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    setError(null);
    
    try {
      const cancelMutation = {
        query: `mutation orderCancel($orderId: ID!, $reason: OrderCancelReason!, $restock: Boolean!) {
          orderCancel(orderId: $orderId, reason: $reason, restock: $restock) {
            job {
              id
            }
            orderCancelUserErrors {
              field
              message
            }
          }
        }`,
        variables: {
          orderId: orderData.id,
          reason: 'DECLINED',
          restock: true
        }
      };

      console.log('Sending cancel mutation:', JSON.stringify(cancelMutation, null, 2));

      const res = await fetch("shopify:admin/api/graphql.json", {
        method: "POST",
        body: JSON.stringify(cancelMutation),
      });

      const result = await res.json();
      console.log('Cancel result:', result);
      
      if (result.data?.orderCancel?.orderCancelUserErrors?.length > 0) {
        throw new Error(result.data.orderCancel.orderCancelUserErrors[0].message);
      } else if (result.errors) {
        throw new Error(result.errors[0].message);
      } else {
        console.log('Order cancelled successfully');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const allAccountsHaveFunds = accountsData.length > 0 && 
    accountsData.every(account => account.hasSufficientFunds);
  
  const allAccountsExpired = accountsData.length > 0 && 
    accountsData.every(account => account.isExpired);
  
  const allAccountsInsufficientFunds = accountsData.length > 0 && 
    accountsData.every(account => !account.hasSufficientFunds);
  
  const shouldDisableReleaseHold = allAccountsExpired || allAccountsInsufficientFunds;

  // Get eligible and restricted items
  const eligibleItems = orderData?.lineItems.edges.filter(edge => {
    const sku = edge.node.sku;
    return sku && !restrictedItems.includes(sku);
  }) || [];

  const otherItems = orderData?.lineItems.edges.filter(edge => {
    const sku = edge.node.sku;
    return sku && restrictedItems.includes(sku);
  }) || [];

  if (!hasFinancialAid) {
    return (
      <s-admin-block heading="Financial Aid Validation">
        <s-banner tone="info">
          <s-text>Financial Aid Validation (if Major Account used)</s-text>
        </s-banner>
      </s-admin-block>
    );
  }

  return (
    <s-admin-block heading="Financial Aid Validation">
      <s-stack direction="block" gap="base">

        {orderBlocked && (
          <s-stack 
            direction="block" 
            alignContent='center' 
            alignItems='center' 
            justifyContent='center' 
            padding='large'
            gap='base'
          >
            <s-text>🚫</s-text>
            <s-text type="strong">
              {blockedReason === 'cancelled' 
                ? 'Order already cancelled' 
                : 'Order is already fulfilled'}
            </s-text>
          </s-stack>
        )}

        {!orderBlocked && noHoldFound && (
          <s-banner tone='info'>
            <s-text>Hold has been successfully released</s-text>
          </s-banner>
        )}

        {!orderBlocked && !noHoldFound && showFunds && allAccountsExpired && (
          <s-banner tone='critical'>
            <s-text>All end dates are in the past - sale or refunds not permitted</s-text>
          </s-banner>
        )}

        {!orderBlocked && !noHoldFound && showFunds && accountsData.length > 0 && (
          <s-banner tone={allAccountsHaveFunds ? 'success' : 'critical'}>
            <s-text>
              {allAccountsHaveFunds 
                ? 'All accounts have sufficient funds!' 
                : 'Some accounts have insufficient funds!'}
            </s-text>
          </s-banner>
        )}

        {!orderBlocked && !noHoldFound && error && (
          <s-banner tone={error === 'This order was not created using Financial Aid' ? 'info' : 'critical'}>
            <s-text>{error}</s-text>
          </s-banner>
        )}
        
        {!orderBlocked && !noHoldFound && (loading || checkingFunds) && (
          <s-stack direction="inline" alignContent='center' justifyContent='center' padding='large'>
            <s-spinner size="large" />
          </s-stack>
        )}
        
        {!orderBlocked && !noHoldFound && !loading && !checkingFunds && showFunds && accountsData.length > 0 && (
          <s-stack direction="block" gap="base">
            
            {/* Tabs */}
            <s-stack direction="inline" gap='small-300'>
              <s-button 
                onClick={() => setActiveTab('overview')}
                variant={activeTab === 'overview' ? 'primary' : 'secondary'}
              >
                Overview
              </s-button>
              <s-button 
                onClick={() => setActiveTab('eligible-items')}
                variant={activeTab === 'eligible-items' ? 'primary' : 'secondary'}
              >
                FA Items ({eligibleItems.length})
              </s-button>
              {otherItems.length > 0 && (
                <s-button 
                  onClick={() => setActiveTab('other-items')}
                  variant={activeTab === 'other-items' ? 'primary' : 'secondary'}
                >
                  Other Items ({otherItems.length})
                </s-button>
              )}
            </s-stack>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <s-stack direction="block" gap='base'>
                
                {/* Financial Aid Account Info */}
                {accountsData.filter(account => account.description === activeFA).map((account) => (
                  <s-stack 
                    key={account.id} 
                    direction="block" 
                    border='base subdued solid' 
                    borderRadius='base' 
                    padding='base'
                    gap='small-300'
                  >
                    <s-stack paddingBlockEnd="small-200">
                      <s-text type="strong">{account.description}</s-text>
                    </s-stack>
                    
                    <s-stack direction="block" gap="small-200">
                      <s-stack direction="inline" gap="small-200">
                        <s-text color="subdued">Online Close Date:</s-text>
                        <s-text type='strong'>{account.closeDate != null ? account.closeDate : "-"}</s-text>
                        {account.isExpired && (
                          <s-badge tone="critical">Expired</s-badge>
                        )}
                      </s-stack>
                      
                      <s-stack direction="inline" gap="small-200">
                        <s-text color="subdued">In Store Close Date:</s-text>
                        <s-text type='strong'>{account.closeDate != null ? account.closeDate : "-"}</s-text>
                      </s-stack>
                      
                      <s-stack direction="inline" gap="small-200">
                        <s-text color="subdued">Available Credit:</s-text>
                        <s-text type='strong'>{formatCurrency(account.availableBalance)}</s-text>
                      </s-stack>
                      
                      <s-stack direction="inline" gap="small-200">
                        <s-text color="subdued">Eligible Amount:</s-text>
                        <s-text type='strong'>{formatCurrency(account.eligibleAmount)}</s-text>
                        <s-badge tone={account.hasSufficientFunds ? 'success' : 'critical'}>
                          {account.hasSufficientFunds ? 'Available' : 'Unavailable'}
                        </s-badge>
                      </s-stack>
                      
                      {account.appliedAmount > 0 && (
                        <s-stack direction="inline" gap="small-200">
                          <s-text color="subdued">Applied Amount:</s-text>
                          <s-text type='strong'>{formatCurrency(account.appliedAmount)}</s-text>
                        </s-stack>
                      )}

                      {account.giftCardCode && (
                        <s-stack direction="inline" gap="small-200">
                          <s-text color="subdued">Financial Aid:</s-text>
                          <s-text>****{account.giftCardCode.slice(-4)}</s-text>
                        </s-stack>
                      )}
                    </s-stack>
                  </s-stack>
                ))}

                {/* Release All Holds or Cancel Order */}
                {fulfillmentOrders.length > 0 && allAccountsHaveFunds && (
                  <s-stack paddingBlockStart='small-300'>
                    <s-button 
                      onClick={handleReleaseAllHolds} 
                      disabled={releasingHolds || shouldDisableReleaseHold}
                      variant="primary"
                      loading={releasingHolds}
                    >
                      {releasingHolds ? 'Releasing All Holds...' : `Release All Holds (${fulfillmentOrders.length})`}
                    </s-button>
                  </s-stack>
                )}

                {fulfillmentOrders.length === 0 && (
                  <s-stack 
                    direction="block" 
                    border='base subdued solid' 
                    borderRadius='base' 
                    padding='base'
                  >
                    <s-text color="subdued">✓ All fulfillment holds released</s-text>
                  </s-stack>
                )}

                {!allAccountsHaveFunds && (
                  <s-stack paddingBlockStart='small-300'>
                    <s-button 
                      onClick={handleCancelOrder} 
                      disabled={cancelling}
                      tone="critical"
                      loading={cancelling}
                    >
                      Cancel Order
                    </s-button>
                  </s-stack>
                )}
              </s-stack>
            )}

            {/* Eligible Items Tab */}
            {activeTab === 'eligible-items' && (
              <s-stack direction="block" gap='base'>
                {eligibleItems.length > 0 ? (
                  <s-stack 
                    direction="block" 
                    border='base subdued solid' 
                    borderRadius='base' 
                    padding='base'
                    gap='small-300'
                  >
                    <s-stack paddingBlockEnd="small-200">
                      <s-text type="strong">Eligible Order Items</s-text>
                    </s-stack>
                    
                    <s-stack direction="block" gap="small-200">
                      {eligibleItems.map((edge) => {
                        const item = edge.node;
                        const unitPrice = item.originalUnitPriceSet?.shopMoney?.amount || 0;
                        const currency = item.originalUnitPriceSet?.shopMoney?.currencyCode || 'USD';
                        
                        return (
                          <s-stack 
                            key={item.id} 
                            direction="inline" 
                            gap="small-500"
                            paddingBlock='small-200'
                            borderRadius='base'
                            padding='small-300'
                            alignItems='center'
                            justifyContent='space-between'
                          >
                            <s-stack direction="block">
                              <s-text type="strong">{item.name}</s-text>
                              <s-text color="subdued">Qty: {item.quantity}</s-text>
                            </s-stack>
                            <s-text type="strong">{formatCurrency(unitPrice, currency)}</s-text>
                          </s-stack>
                        );
                      })}
                    </s-stack>
                  </s-stack>
                ) : (
                  <s-stack 
                    direction="block" 
                    border='base subdued solid' 
                    borderRadius='base' 
                    padding='base'
                  >
                    <s-text color="subdued">No eligible items</s-text>
                  </s-stack>
                )}
              </s-stack>
            )}

            {/* Other Items Tab */}
            {activeTab === 'other-items' && (
              <s-stack direction="block" gap='base'>
                {otherItems.length > 0 ? (
                  <s-stack 
                    direction="block" 
                    border='base subdued solid' 
                    borderRadius='base' 
                    padding='base'
                    gap='small-300'
                  >
                    <s-stack paddingBlockEnd="small-200">
                      <s-text type="strong">Other Items</s-text>
                    </s-stack>
                    
                    <s-stack direction="block" gap="small-200">
                      {otherItems.map((edge) => {
                        const item = edge.node;
                        const unitPrice = item.originalUnitPriceSet?.shopMoney?.amount || 0;
                        const currency = item.originalUnitPriceSet?.shopMoney?.currencyCode || 'USD';
                        
                        return (
                          <s-stack 
                            key={item.id} 
                            direction="inline" 
                            gap="small-500"
                            paddingBlock='small-200'
                            borderRadius='base'
                            padding='small-300'
                            alignItems='center'
                            justifyContent='space-between'
                          >
                            <s-stack direction="block">
                              <s-text type="strong">{item.name}</s-text>
                              <s-text color="subdued">Qty: {item.quantity}</s-text>
                            </s-stack>
                            <s-text type="strong">{formatCurrency(unitPrice, currency)}</s-text>
                          </s-stack>
                        );
                      })}
                    </s-stack>
                  </s-stack>
                ) : (
                  <s-stack 
                    direction="block" 
                    border='base subdued solid' 
                    borderRadius='base' 
                    padding='base'
                  >
                    <s-text color="subdued">No other items</s-text>
                  </s-stack>
                )}
              </s-stack>
            )}
          </s-stack>
        )}
      </s-stack>
    </s-admin-block>
  );
}