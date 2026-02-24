import React, { useEffect } from 'react'

import { Button, reactExtension, useApi, useCartSubscription } from '@shopify/ui-extensions-react/point-of-sale'

const TileComponent = () => {
  const api = useApi()
  const cart=useCartSubscription();

  useEffect(() => {
    if (!cart.properties?.['Tax Exempt Number'] && Number(cart?.taxTotal) == 0 && cart.lineItems.length > 0) {
        api.action.presentModal()
    }
  }, [cart]);
  return (
    <Button title="Tax Override" onPress={() => api.action.presentModal()} />
  )
}

export default reactExtension('pos.customer-details.action.menu-item.render', () => {
  return <TileComponent />
})