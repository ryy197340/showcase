import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useApplyAttributeChange} from '@shopify/ui-extensions/checkout/preact';
import {useEffect} from 'preact/hooks';

export default async () => {
  render(<Extension />, document.body)
};

function Extension() {
  const applyAttributeChange = useApplyAttributeChange();
  
  useEffect(() => {
    const subtotal = shopify.cost.subtotalAmount.value.amount;
    const total = shopify.cost.subtotalAmount.value.amount;
    const tax = shopify.cost.totalTaxAmount.value.amount;
    const currency = shopify.cost.subtotalAmount.value.currencyCode;
    const timestamp = new Date().toISOString();

    const info = {
      subtotal: subtotal,
      tax: tax,
      total: total,
      currency: currency,
      timestamp: timestamp
    }

    console.log("DEBUG ADD INFO --> ", info)

    if (subtotal && total && tax && currency && timestamp) { 
      applyAttributeChange({
        key: "_order_pricing_info",
        value: JSON.stringify(info),
        type: "updateAttribute"
      });
    }
  }, []);

  return null;
}