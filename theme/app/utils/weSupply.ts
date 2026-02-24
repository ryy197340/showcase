export const getOrdersByCustomerEmail = async (email: string, context: any) => {
  const storeDomain = context.env.WE_SUPPLY_STORE_DOMAIN;
  const apiKey = context.env.WE_SUPPLY_API_KEY;

  const options = {
    method: 'GET',
    headers: {
      'X-WeSupply-Api-Secret': apiKey,
      'Accept-Encoding': '*',
    },
  };

  try {
    const response = await fetch(
      `https://${storeDomain}.labs.wesupply.xyz/api-url/orders/lookup?CustomerEmail=${email}`,
      options,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch WeSupply order info for email: ${email}`,
      );
    }

    return response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching WeSupply order Info:', error);
    return {}; // or throw error if you want to propagate it
  }
};

export const getOrderInfo = async (orderId: string, context: any) => {
  const storeDomain = context.env.WE_SUPPLY_STORE_DOMAIN;
  const apiKey = context.env.WE_SUPPLY_API_KEY;

  const options = {
    method: 'GET',
    headers: {
      'X-WeSupply-Api-Secret': apiKey,
      'Accept-Encoding': '*',
    },
  };

  try {
    const response = await fetch(
      `https://${storeDomain}.labs.wesupply.xyz/api-url/orders/lookup?OrderID=ONLINE${orderId}`,
      options,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch WeSupply order info for orderId: ONLINE${orderId}`,
      );
    }

    return response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching WeSupply order Info:', error);
    return {}; // or throw error if you want to propagate it
  }
};

export const getOrderUrls = async (orderIds: string[], context: any) => {
  if (!orderIds.length) {
    // eslint-disable-next-line no-console
    console.log('No order IDs provided to fetch WeSupply order URLs.');
    return {};
  }

  const storeDomain = context.env.WE_SUPPLY_STORE_DOMAIN;
  const apiKey = context.env.WE_SUPPLY_API_KEY;
  const orderIdsParam = encodeURIComponent(orderIds.join(','));
  const options = {
    method: 'GET',
    headers: {
      'X-WeSupply-Api-Secret': apiKey,
      'Accept-Encoding': '*',
    },
  };

  try {
    // Fetch order URLs with all order IDs
    const response = await fetch(
      `https://${storeDomain}.labs.wesupply.xyz/api-url/authLinks?OrderExternalOrderIDs=${orderIdsParam}`,
      options,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch WeSupply order URLs');
    }

    const weSupplyOrderUrls: any = await response.json();
    // Modify order URLs format

    const modifiedOrderUrls: any = {};
    for (const key in weSupplyOrderUrls as any) {
      if (Object.prototype.hasOwnProperty.call(weSupplyOrderUrls, key)) {
        const orderNumber = key.replace('ONLINE', '');
        modifiedOrderUrls[orderNumber] = weSupplyOrderUrls[key];
      }
    }
    return modifiedOrderUrls;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching WeSupply order URLs:', error);
    return {};
  }
};

export const fetchWeSupplyDataUseEffect = async (customerEmail, ordersIds) => {
  try {
    const response = await fetch(
      `/api/weSupplyOrders?email=${customerEmail}&ordersIds=${ordersIds}`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch WeSupply data');
    }
    const responseJson = await response.json();

    return responseJson;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching WeSupply data:', error);
    throw error;
  }
};
