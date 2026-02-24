import {LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {VARIATIONS_COLOR_SWATCH_QUERY} from '~/queries/shopify/product';
import {getQueryParam} from '~/utils/global';

export async function loader({context, request}: LoaderFunctionArgs) {
  const paramsToExtract = ['family', 'id'];
  const queryParams = Object.fromEntries(
    paramsToExtract.map((param) => [param, getQueryParam(request.url, param)]),
  );
  const {family, id} = queryParams;

  // get color swatches from shopify and use cioFamilyTag for CIO recommendations
  const familyTag = 'Family: ' + family;
  let colorSwatches;
  try {
    colorSwatches = familyTag
      ? await context.storefront.query(VARIATIONS_COLOR_SWATCH_QUERY, {
          variables: {
            tag: familyTag as string,
          },
        })
      : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error:', error);
    colorSwatches = null;
  }

  return {
    colorSwatches,
  };
}
