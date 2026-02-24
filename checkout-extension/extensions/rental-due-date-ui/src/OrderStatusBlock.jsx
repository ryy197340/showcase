import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useMemo, useState, useEffect } from 'preact/hooks';

export default () => {
  render(<RentalExtension />, document.body);
};

function RentalExtension() {
  console.log("[RentalExtension] ===== Component Initialized =====");

  // Line item from Target
  const line = shopify.target?.value;

  console.log("[RentalExtension] line = ", line);

  if (!line) {
    console.log("[RentalExtension] No line item found");
    return null;
  }

  const attributes = line.attributes || [];
  const variantId = line?.merchandise?.id;

  console.log("[RentalExtension] variantId = ", variantId);
  console.log("[RentalExtension] attributes = ", attributes);

  // Attributes from line item
  const rentalLocal = useMemo(() => getRentalDataFromAttributes(attributes), [attributes]);

  // Only Rental - otherwise do
  if (!rentalLocal.rentalFlag) {
    console.log("[RentalExtension] rentalFlag = false → skipping UI");
    return null;
  }
  return (
    <s-banner>
      <s-text type='strong'>Rental Due By: {formatDateMMDDYYYY(rentalLocal.expirationDate)}</s-text>
      <s-text type='strong'> - </s-text>
      <s-text>Late returns will result in an additional charge of ${Number(rentalLocal.nonReturnCharge || 0).toFixed(2)} to the card on file.</s-text>
    </s-banner>
  );

}

function formatDateMMDDYYYY(dateString) {
  if (!dateString) return "N/A";

  // Wait "YYYY-MM-DD"
  const parts = dateString.split("-");
  if (parts.length !== 3) {
    // fallback if it has another format
    return dateString;
  }

  const [year, month, day] = parts;
  return `${month}/${day}/${year}`;
}

function getRentalDataFromAttributes(attributes) {
  console.log("[RentalExtension] Mapping attributes → rental data");

  const map = {};
  attributes.forEach(attr => { map[attr.key] = attr.value; });

  console.log("[RentalExtension] attribute map = ", map);

  return {
    processingFee: map["_non_return_processing_fee"],
    nonReturnCharge: map["_non_return_charge"],
    expirationDate: map["_rental_expiration_date"],
    rentalFlag: map["_rental_flag"] === "true",
  };
}
