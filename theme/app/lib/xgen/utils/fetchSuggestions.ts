import {XGenClient} from '@xgenai/sdk-core';

export type XGenSuggestionsResponse = string[];

export type FetchSuggestionsOptions = {
  query: string;
  collection?: string;
  limit?: number;
  deploymentId?: string;
};

/**
 * Fetches suggestions from XGen API based on a query
 * @param xgenClient - XGen client configuration
 * @param options - Options for the suggestions request
 * @returns Promise with suggestions data
 */
export default async function fetchSuggestions(
  xgenClient: XGenClient,
  options: FetchSuggestionsOptions,
): Promise<XGenSuggestionsResponse> {
  const {query, collection = 'default', limit} = options;

  // @ts-expect-error serviceClient is private
  const clientId = xgenClient.serviceClient!.clientId!;
  const userId = xgenClient?.authStore?.user?.userId;
  const accessToken =
    xgenClient?.authStore?.token || // this may be null depending on cookie order
    // @ts-expect-error baseToken is protected
    xgenClient?.authStore?.baseToken?.token;

  if (!clientId || !accessToken) {
    throw new Error(
      'Missing required XGen credentials: clientId or accessToken',
    );
  }

  const baseUrl = 'https://prompt.xgen.dev/v1';
  const url = new URL(
    `${baseUrl}/customers/${clientId}/users/${userId}/collections/${collection}/suggestions`,
  );
  url.searchParams.set('query', query);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        accept: '*/*',
        access_token: accessToken,
        'content-type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `XGen API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as XGenSuggestionsResponse;
    return data;
  } catch (error) {
    console.error('Error fetching XGen suggestions:', error);
    return [];
  }
}
