// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  return {
    operations: input.locations.map(location => ({
      add: {
        title: location.metafield?.value || location.name,
        pickupLocation: {
          locationHandle: location.handle,
        }
      }
    }))
  };
}