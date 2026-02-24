import {useRouteLoaderData} from '@remix-run/react';
import type {RecommendProduct} from '@xgenai/sdk-core';

export function useInitialRecommendations(): RecommendProduct[] | null {
  const rootData = useRouteLoaderData('root') as any;
  return rootData?.initialRecommendations || null;
}
