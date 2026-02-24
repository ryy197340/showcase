interface SwymEnv {
  SWYM_REST_API_KEY?: string;
  SWYM_ENDPOINT?: string;
  SWYM_PID?: string;
}

const getSwymConfig = (env: SwymEnv = {}) => {
  return {
    REST_API_KEY: env.SWYM_REST_API_KEY,
    SWYM_ENDPOINT: env.SWYM_ENDPOINT,
    PID: env.SWYM_PID,
    defaultWishlistName: 'My Wishlist',
    alertTimeOut: 5000,
    swymSharedURL: 'shared-wishlist',
    swymSharedMediumCopyLink: 'copylink',
    backInStockSubscriptionsLimit: 100,
  };
};

export default getSwymConfig;
