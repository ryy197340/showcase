// @ts-check

/*
The function reads the cart. Any item with _digital_delivery_fee attribute will be used
to generate an update operation with a custom price, image, and SKU.

Also validates and restores rental properties (_rental_expiration_date, Rent Due Date) 
if they are missing after customer login.
*/

/**
 * @typedef {import("../generated/api").Input} Input
 * @typedef {import("../generated/api").CartTransformRunResult} CartTransformRunResult
 * @typedef {import("../generated/api").Operation} Operation
 */

/**
 * @type {CartTransformRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {Input} input
 * @returns {CartTransformRunResult}
 */
export function cartTransformRun(input) {
  const operations = input.cart.lines.reduce(
    /** @param {Operation[]} acc */
    (acc, cartLine) => {
      // Check for digital delivery fee updates
      const digitalFeeOperation = optionallyBuildUpdateOperation(cartLine);
      if (digitalFeeOperation) {
        acc.push({ lineUpdate: digitalFeeOperation });
      }

      // Check for rental properties restoration
      const rentalOperation = optionallyBuildRentalPropertiesOperation(cartLine);
      if (rentalOperation) {
        acc.push({ lineUpdate: rentalOperation });
      }

      return acc;
    },
    []
  );

  return operations.length > 0 ? { operations } : NO_CHANGES;
}

/**
 * Builds an update operation for digital delivery fee items
 * @param {Input['cart']['lines'][number]} cartLine
 */
function optionallyBuildUpdateOperation(cartLine) {
    const digitalDeliveryFee = cartLine.digitalDeliveryFee?.value;
    const feeAmount = cartLine.feeAmount?.value;
    const cartFeeImage = cartLine.cartFeeImage?.value;

    if (digitalDeliveryFee === 'true') {

      let operationResult = {
        cartLineId: cartLine.id,
      }

      if(feeAmount) {
        const amount = parseFloat(feeAmount);
        if (!isNaN(amount)) {
          operationResult = {
            ...operationResult,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: amount,
                },
              },
            }
          }
        }
      }

      if(cartFeeImage) {
        const cleanImageUrl = cartFeeImage.replace(/\\\//g, '/');
        const fullImageUrl = cleanImageUrl.startsWith('//') ? `https:${cleanImageUrl}` : cleanImageUrl;
        const imageUrlWithWidth = `${fullImageUrl}&width=80`;
        
        operationResult = {
          ...operationResult,
          image: {
            url: imageUrlWithWidth
          }
        }
      }

      return operationResult;
    } else {
      return null;
    }
}

/**
 * Validates and restores rental properties if they are missing
 * This handles the case where cart properties are lost after customer login
 * 
 * Note: Cart Transform functions can only update price, image, and title.
 * Properties restoration must be handled in Checkout Extension UI using
 * useApplyCartLinesChange hook. This function serves as a validation check.
 * 
 * @param {Input['cart']['lines'][number]} cartLine
 */
function optionallyBuildRentalPropertiesOperation(cartLine) {
  // Check if this is a rental item
  const merchandise = cartLine.merchandise;
  if (!merchandise || merchandise.__typename !== 'ProductVariant') {
    return null;
  }

  const isRental = merchandise.isRental?.value === 'true' || merchandise.isRental?.value === true;
  if (!isRental) {
    return null;
  }

  // Check if rental expiration date is missing or empty
  const currentRentalExpDate = cartLine.rentalExpirationDate?.value;
  const currentRentDueDate = cartLine.rentDueDate?.value;
  const metafieldExpDate = merchandise.rentalExpDate?.value;

  // If properties are missing but metafield has a value, we need to restore
  const needsRestoration = 
    (!currentRentalExpDate || currentRentalExpDate.trim() === '') &&
    (!currentRentDueDate || currentRentDueDate.trim() === '') &&
    metafieldExpDate &&
    metafieldExpDate.trim() !== '';

  if (!needsRestoration) {
    return null;
  }

  // Note: LineUpdateOperation doesn't support attributes/properties directly
  // The actual restoration should be handled in Checkout Extension UI
  // using useApplyCartLinesChange hook with updateCartLine operation
  // This function validates the issue but returns null
  // The Checkout Extension will handle the actual restoration
  
  return null;
}